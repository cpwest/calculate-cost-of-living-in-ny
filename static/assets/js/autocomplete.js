/**
 * Simple, lightweight, usable local autocomplete library for modern browsers
 * Because there weren’t enough autocomplete scripts in the world? Because I’m completely insane and have NIH syndrome? Probably both. :P
 * @author Lea Verou http://leaverou.github.io/awesomplete
 * MIT license
 */

(function () {

    var _ = function (input, o) {
        var me = this;

        // Keep track of number of instances for unique IDs
        _.count = (_.count || 0) + 1;
        this.count = _.count;

        // Setup

        this.isOpened = false;

        this.input = $(input);
        this.input.setAttribute("autocomplete", "off");
        this.input.setAttribute("aria-owns", "awesomplete_list_"+ this.count);
        this.input.setAttribute("role", "combobox");

        // store constructor options in case we need to distinguish
        // between default and customized behavior later on
        this.options = o = o || {};

        configure(this, {
            minChars: 2,
            maxItems: 10,
            autoFirst: false,
            data: _.DATA,
            filter: _.FILTER_CONTAINS,
            sort: o.sort === false ? false : _.SORT_BYLENGTH,
            container: _.CONTAINER,
            item: _.ITEM,
            replace: _.REPLACE,
            tabSelect: false
        }, o);

        this.index = -1;

        // Create necessary elements

        this.container = this.container(input);

        this.ul = $.create("ul", {
            hidden: "hidden",
            role: "listbox",
            id: "awesomplete_list_"+ this.count,
            inside: this.container
        });

        this.status = $.create("span", {
            className: "visually-hidden",
            role: "status",
            "aria-live": "assertive",
            "aria-atomic": true,
            inside: this.container,
            textContent: this.minChars != 0 ? ("Type "+ this.minChars + "or more characters for results.") : "Begin typing for results."
        });

        // Bind events

        this._events = {
            input: {
                "input": this.evaluate.bind(this),
                "blur": this.close.bind(this, {reason: "blur"}),
                "keydown": function (evt) {
                    var c = evt.keyCode;

                    // If the dropdown `ul` is in view, then act on keydown for the following keys:
                    // Enter / Esc / Up / Down
                    if (me.opened) {
                        if (c === 13 && me.selected) { // Enter
                            evt.preventDefault();
                            me.select();
                        }
                        else if (c === 9 && me.selected && me.tabSelect) {
                            me.select();
                        }
                        else if (c === 27) { // Esc
                            me.close({reason: "esc"});
                        }
                        else if (c === 38 || c === 40) { // Down/Up arrow
                            evt.preventDefault();
                            me[c === 38 ? "previous": "next"]();
                        }
                    }
                }
            },
            form: {
                // "submit": this.close.bind(this, {reason: "submit"})
            },
            ul: {
                // Prevent the default mousedowm, which ensures the input is not blurred.
                // The actual selection will happen on click. This also ensures dragging the
                // cursor away from the list item will cancel the selection
                "mousedown": function (evt) {
                    evt.preventDefault();
                },
                // The click event is fired even if the corresponding mousedown event has called preventDefault
                "click": function (evt) {
                    var li = evt.target;

                    if (li !== this) {

                        while (li && !/li/i.test(li.nodeName)) {
                            li = li.parentNode;
                        }

                        if (li && evt.button === 0) {  // Only select on left click
                            evt.preventDefault();
                            me.select(li, evt.target);
                        }
                    }
                }
            }
        };

        $.bind(this.input, this._events.input);
        $.bind(this.input.form, this._events.form);
        $.bind(this.ul, this._events.ul);

        if (this.input.hasAttribute("list")) {
            this.list = "#"+ this.input.getAttribute("list");
            this.input.removeAttribute("list");
        }
        else {
            this.list = this.input.getAttribute("data-list") || o.list || [];
        }

        _.all.push(this);
    };

    _.prototype = {
        set list(list) {
            if (Array.isArray(list)) {
                this._list = list;
            }
            else if (typeof list === "string"&& list.indexOf(",") > -1) {
                this._list = list.split(/\s*,\s*/);
            }
            else { // Element or CSS selector
                list = $(list);

                if (list && list.children) {
                    var items = [];
                    slice.apply(list.children).forEach(function (el) {
                        if (!el.disabled) {
                            var text = el.textContent.trim();
                            var value = el.value || text;
                            var label = el.label || text;
                            if (value !== "") {
                                items.push({label: label, value: value});
                            }
                        }
                    });
                    this._list = items;
                }
            }

            if (document.activeElement === this.input) {
                this.evaluate();
            }
        },

        get selected() {
            return this.index > -1;
        },

        get opened() {
            return this.isOpened;
        },

        close: function (o) {
            if (!this.opened) {
                return;
            }

            this.ul.setAttribute("hidden", "");
            this.isOpened = false;
            this.index = -1;

            this.status.setAttribute("hidden", "");

            $.fire(this.input, "awesomplete-close", o || {});
        },

        open: function () {
            this.ul.removeAttribute("hidden");
            this.isOpened = true;

            this.status.removeAttribute("hidden");

            if (this.autoFirst && this.index === -1) {
                this.goto(0);
            }

            $.fire(this.input, "awesomplete-open");
        },

        destroy: function () {
            //remove events from the input and its form
            $.unbind(this.input, this._events.input);
            $.unbind(this.input.form, this._events.form);

            // cleanup container if it was created by Awesomplete but leave it alone otherwise
            if (!this.options.container) {
                //move the input out of the awesomplete container and remove the container and its children
                var parentNode = this.container.parentNode;

                parentNode.insertBefore(this.input, this.container);
                parentNode.removeChild(this.container);
            }

            //remove autocomplete and aria-autocomplete attributes
            this.input.removeAttribute("autocomplete");
            this.input.removeAttribute("aria-autocomplete");

            //remove this awesomeplete instance from the global array of instances
            var indexOfAwesomplete = _.all.indexOf(this);

            if (indexOfAwesomplete !== -1) {
                _.all.splice(indexOfAwesomplete, 1);
            }
        },

        next: function () {
            var count = this.ul.children.length;
            this.goto(this.index < count - 1 ? this.index + 1 : (count ? 0 : -1));
        },

        previous: function () {
            var count = this.ul.children.length;
            var pos = this.index - 1;

            this.goto(this.selected && pos !== -1 ? pos : count - 1);
        },

        // Should not be used, highlights specific item without any checks!
        goto: function (i) {
            var lis = this.ul.children;

            if (this.selected) {
                lis[this.index].setAttribute("aria-selected", "false");
            }

            this.index = i;

            if (i > -1 && lis.length > 0) {
                lis[i].setAttribute("aria-selected", "true");

                this.status.textContent = lis[i].textContent + ", list item "+ (i + 1) + "of "+ lis.length;

                this.input.setAttribute("aria-activedescendant", this.ul.id + "_item_"+ this.index);

                // scroll to highlighted element in case parent's height is fixed
                this.ul.scrollTop = lis[i].offsetTop - this.ul.clientHeight + lis[i].clientHeight;

                $.fire(this.input, "awesomplete-highlight", {
                    text: this.suggestions[this.index]
                });
            }
        },

        select: function (selected, origin) {
            if (selected) {
                this.index = $.siblingIndex(selected);
            } else {
                selected = this.ul.children[this.index];
            }

            if (selected) {
                var suggestion = this.suggestions[this.index];

                var allowed = $.fire(this.input, "awesomplete-select", {
                    text: suggestion,
                    origin: origin || selected
                });

                if (allowed) {
                    this.replace(suggestion);
                    this.close({reason: "select"});
                    $.fire(this.input, "awesomplete-selectcomplete", {
                        text: suggestion
                    });
                }
            }
        },

        evaluate: function () {
            var me = this;
            var value = this.input.value;

            if (value.length >= this.minChars && this._list && this._list.length > 0) {
                this.index = -1;
                // Populate list with options that match
                this.ul.innerHTML = "";

                this.suggestions = this._list
                    .map(function (item) {
                        return new Suggestion(me.data(item, value));
                    })
                    .filter(function (item) {
                        return me.filter(item, value);
                    });

                if (this.sort !== false) {
                    this.suggestions = this.suggestions.sort(this.sort);
                }

                this.suggestions = this.suggestions.slice(0, this.maxItems);

                this.suggestions.forEach(function (text, index) {
                    me.ul.appendChild(me.item(text, value, index));
                });

                if (this.ul.children.length === 0) {

                    this.status.textContent = "No results found";

                    this.close({reason: "nomatches"});

                } else {
                    this.open();

                    this.status.textContent = this.ul.children.length + "results found";
                }
            }
            else {
                this.close({reason: "nomatches"});

                this.status.textContent = "No results found";
            }
        }
    };

    // Static methods/properties

    _.all = [];

    _.FILTER_CONTAINS = function (text, input) {
        return RegExp($.regExpEscape(input.trim()), "i").test(text);
    };

    _.FILTER_STARTSWITH = function (text, input) {
        return RegExp("^"+ $.regExpEscape(input.trim()), "i").test(text);
    };

    _.SORT_BYLENGTH = function (a, b) {
        if (a.length !== b.length) {
            return a.length - b.length;
        }

        return a < b ? -1 : 1;
    };

    _.CONTAINER = function (input) {
        return $.create("div", {
            className: "awesomplete",
            around: input
        });
    }

    _.ITEM = function (text, input, item_id) {
        var html = input.trim() === ""? text : text.replace(RegExp($.regExpEscape(input.trim()), "gi"), "<mark>$&</mark>");
        return $.create("li", {
            innerHTML: html,
            "aria-selected": "false",
            "id": "awesomplete_list_"+ this.count + "_item_"+ item_id
        });
    };

    _.REPLACE = function (text) {
        this.input.value = text.value;
    };

    _.DATA = function (item/*, input*/) {
        return item;
    };

    // Private functions

    function Suggestion(data) {
        var o = Array.isArray(data)
            ? {label: data[0], value: data[1]}
            : typeof data === "object"&& "label"in data && "value"in data ? data : {label: data, value: data};

        this.label = o.label || o.value;
        this.value = o.value;
    }

    Object.defineProperty(Suggestion.prototype = Object.create(String.prototype), "length", {
        get: function () {
            return this.label.length;
        }
    });
    Suggestion.prototype.toString = Suggestion.prototype.valueOf = function () {
        return ""+ this.label;
    };

    function configure(instance, properties, o) {
        for (var i in properties) {
            var initial = properties[i],
                attrValue = instance.input.getAttribute("data-"+ i.toLowerCase());

            if (typeof initial === "number") {
                instance[i] = parseInt(attrValue);
            }
            else if (initial === false) { // Boolean options must be false by default anyway
                instance[i] = attrValue !== null;
            }
            else if (initial instanceof Function) {
                instance[i] = null;
            }
            else {
                instance[i] = attrValue;
            }

            if (!instance[i] && instance[i] !== 0) {
                instance[i] = (i in o) ? o[i] : initial;
            }
        }
    }

    // Helpers

    var slice = Array.prototype.slice;

    function $(expr, con) {
        return typeof expr === "string"? (con || document).querySelector(expr) : expr || null;
    }

    function $$(expr, con) {
        return slice.call((con || document).querySelectorAll(expr));
    }

    $.create = function (tag, o) {
        var element = document.createElement(tag);

        for (var i in o) {
            var val = o[i];

            if (i === "inside") {
                $(val).appendChild(element);
            }
            else if (i === "around") {
                var ref = $(val);
                ref.parentNode.insertBefore(element, ref);
                element.appendChild(ref);

                if (ref.getAttribute("autofocus") != null) {
                    ref.focus();
                }
            }
            else if (i in element) {
                element[i] = val;
            }
            else {
                element.setAttribute(i, val);
            }
        }

        return element;
    };

    $.bind = function (element, o) {
        if (element) {
            for (var event in o) {
                var callback = o[event];

                event.split(/\s+/).forEach(function (event) {
                    element.addEventListener(event, callback);
                });
            }
        }
    };

    $.unbind = function (element, o) {
        if (element) {
            for (var event in o) {
                var callback = o[event];

                event.split(/\s+/).forEach(function (event) {
                    element.removeEventListener(event, callback);
                });
            }
        }
    };

    $.fire = function (target, type, properties) {
        var evt = document.createEvent("HTMLEvents");

        evt.initEvent(type, true, true);

        for (var j in properties) {
            evt[j] = properties[j];
        }

        return target.dispatchEvent(evt);
    };

    $.regExpEscape = function (s) {
        return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
    };

    $.siblingIndex = function (el) {
        /* eslint-disable no-cond-assign */
        for (var i = 0; el = el.previousElementSibling; i++) ;
        return i;
    };

    // Initialization

    function init() {
        $$("input.awesomplete").forEach(function (input) {
            new _(input);
        });
    }

    // Make sure to export Awesomplete on self when in a browser
    if (typeof self !== "undefined") {
        self.Awesomplete = _;
    }

    // Are we in a browser? Check for Document constructor
    if (typeof Document !== "undefined") {
        // DOM already loaded?
        if (document.readyState !== "loading") {
            init();
        }
        else {
            // Wait for it
            document.addEventListener("DOMContentLoaded", init);
        }
    }

    _.$ = $;
    _.$$ = $$;

    // Expose Awesomplete as a CJS module
    if (typeof module === "object"&& module.exports) {
        module.exports = _;
    }

    return _;

}());

// var input = document.getElementById("myinput");
var input = document.getElementById("profession-input");

new Awesomplete(input, {
    list: ["Management Occupations", "Chief Executives", "General and Operations Managers", "Legislators", "Advertising and Promotions Managers", "Marketing Managers", "Sales Managers", "Public Relations and Fundraising Managers", "Administrative Services Managers", "Computer and Information Systems Managers", "Financial Managers", "Industrial Production Managers", "Purchasing Managers", "Transportation, Storage, and Distribution Managers", "Compensation and Benefits Managers", "Human Resources Managers", "Training and Development Managers", "Construction Managers", "Education Administrators, Preschool and Childcare Center/Program", "Education Administrators, Elementary and Secondary School", "Education Administrators, Postsecondary", "Education Administrators, All Other", "Architectural and Engineering Managers", "Food Service Managers", "Funeral Service Managers", "Lodging Managers", "Medical and Health Services Managers", "Natural Sciences Managers", "Property, Real Estate, and Community Association Managers", "Social and Community Service Managers", "Emergency Management Directors", "Managers, All Other", "Business and Financial Operations Occupations", "Agents and Business Managers of Artists, Performers, and Athletes", "Buyers and Purchasing Agents", "Claims Adjusters, Examiners, and Investigators", "Compliance Officers", "Cost Estimators", "Human Resources Specialists", "Labor Relations Specialists", "Logisticians", "Management Analysts", "Meeting, Convention, and Event Planners", "Fundraisers", "Compensation, Benefits, and Job Analysis Specialists", "Training and Development Specialists", "Market Research Analysts and Marketing Specialists", "Business Operations Specialists, All Other", "Accountants and Auditors", "Appraisers and Assessors of Real Estate", "Budget Analysts", "Credit Analysts", "Financial Analysts", "Personal Financial Advisors", "Insurance Underwriters", "Financial Examiners", "Credit Counselors", "Loan Officers", "Tax Examiners and Collectors, and Revenue Agents", "Tax Preparers", "Financial Specialists, All Other", "Computer and Mathematical Occupations", "Computer and Information Research Scientists", "Computer Systems Analysts", "Information Security Analysts", "Computer Programmers", "Software Developers, Applications", "Software Developers, Systems Software", "Web Developers", "Database Administrators", "Network and Computer Systems Administrators", "Computer Network Architects", "Computer User Support Specialists", "Computer Network Support Specialists", "Computer Occupations, All Other", "Actuaries", "Operations Research Analysts", "Statisticians", "Miscellaneous Mathematical Science Occupations", "Architecture and Engineering Occupations", "Architects, Except Landscape and Naval", "Landscape Architects", "Cartographers and Photogrammetrists", "Surveyors", "Aerospace Engineers", "Biomedical Engineers", "Chemical Engineers", "Civil Engineers", "Computer Hardware Engineers", "Electrical Engineers", "Electronics Engineers, Except Computer", "Environmental Engineers", "Health and Safety Engineers, Except Mining Safety Engineers and Inspectors", "Industrial Engineers", "Marine Engineers and Naval Architects", "Materials Engineers", "Mechanical Engineers", "Nuclear Engineers", "Engineers, All Other", "Architectural and Civil Drafters", "Electrical and Electronics Drafters", "Mechanical Drafters", "Drafters, All Other", "Civil Engineering Technicians", "Electrical and Electronic Engineering Technicians", "Environmental Engineering Technicians", "Industrial Engineering Technicians", "Mechanical Engineering Technicians", "Engineering Technicians, Except Drafters, All Other", "Surveying and Mapping Technicians", "Life, Physical, and Social Science Occupations", "Food Scientists and Technologists", "Soil and Plant Scientists", "Biochemists and Biophysicists", "Microbiologists", "Zoologists and Wildlife Biologists", "Biological Scientists, All Other", "Conservation Scientists", "Foresters", "Epidemiologists", "Medical Scientists, Except Epidemiologists", "Physicists", "Atmospheric and Space Scientists", "Chemists", "Materials Scientists", "Environmental Scientists and Specialists, Including Health", "Geoscientists, Except Hydrologists and Geographers", "Physical Scientists, All Other", "Economists", "Survey Researchers", "Clinical, Counseling, and School Psychologists", "Psychologists, All Other", "Sociologists", "Urban and Regional Planners", "Anthropologists and Archeologists", "Political Scientists", "Social Scientists and Related Workers, All Other", "Agricultural and Food Science Technicians", "Biological Technicians", "Chemical Technicians", "Social Science Research Assistants", "Environmental Science and Protection Technicians, Including Health", "Life, Physical, and Social Science Technicians, All Other", "Community and Social Service Occupations", "Educational, Guidance, School, and Vocational Counselors", "Marriage and Family Therapists", "Rehabilitation Counselors", "Substance abuse, behavioral disorder, and mental health counselors+(OES-specific code and title)", "Counselors, All Other", "Child, Family, and School Social Workers", "Healthcare Social Workers", "Mental Health and Substance Abuse Social Workers", "Social Workers, All Other", "Health Educators", "Social and Human Service Assistants", "Community Health Workers", "Community and Social Service Specialists, All Other", "Clergy", "Directors, Religious Activities and Education", "Religious Workers, All Other", "Legal Occupations", "Lawyers", "Administrative Law Judges, Adjudicators, and Hearing Officers", "Arbitrators, Mediators, and Conciliators", "Paralegals and Legal Assistants", "Court Reporters", "Title Examiners, Abstractors, and Searchers", "Legal Support Workers, All Other", "Education, Training, and Library Occupations", "Business Teachers, Postsecondary", "Computer Science Teachers, Postsecondary", "Mathematical Science Teachers, Postsecondary", "Architecture Teachers, Postsecondary", "Engineering Teachers, Postsecondary", "Biological Science Teachers, Postsecondary", "Atmospheric, Earth, Marine, and Space Sciences Teachers, Postsecondary", "Chemistry Teachers, Postsecondary", "Environmental Science Teachers, Postsecondary", "Physics Teachers, Postsecondary", "Anthropology and Archeology Teachers, Postsecondary", "Area, Ethnic, and Cultural Studies Teachers, Postsecondary", "Economics Teachers, Postsecondary", "Geography Teachers, Postsecondary", "Political Science Teachers, Postsecondary", "Psychology Teachers, Postsecondary",
        "Sociology Teachers, Postsecondary", "Social Sciences Teachers, Postsecondary, All Other", "Health Specialties Teachers, Postsecondary", "Nursing Instructors and Teachers, Postsecondary", "Education Teachers, Postsecondary", "Library Science Teachers, Postsecondary", "Law Teachers, Postsecondary", "Social Work Teachers, Postsecondary", "Art, Drama, and Music Teachers, Postsecondary", "Communications Teachers, Postsecondary", "English Language and Literature Teachers, Postsecondary", "Foreign Language and Literature Teachers, Postsecondary", "History Teachers, Postsecondary", "Philosophy and Religion Teachers, Postsecondary", "Graduate Teaching Assistants", "Recreation and Fitness Studies Teachers, Postsecondary", "Vocational Education Teachers, Postsecondary", "Postsecondary Teachers, All Other", "Preschool Teachers, Except Special Education", "Kindergarten Teachers, Except Special Education", "Elementary School Teachers, Except Special Education", "Middle School Teachers, Except Special and Career/Technical Education", "Career/Technical  Education Teachers, Middle School", "Secondary School Teachers, Except Special and Career/Technical Education", "Career/Technical Education Teachers, Secondary School", "Special Education Teachers, Preschool", "Special Education Teachers, Kindergarten and Elementary School", "Special Education Teachers, Middle School", "Special Education Teachers, Secondary School", "Special Education Teachers, All Other", "Adult Basic and Secondary Education and Literacy Teachers and Instructors", "Self-Enrichment Education Teachers", "Teachers and Instructors, All Other, Except Substitute Teachers", "Substitute teachers", "Archivists", "Curators", "Museum Technicians and Conservators", "Librarians", "Library Technicians", "Audio-Visual and Multimedia Collections Specialists", "Instructional Coordinators", "Teacher Assistants", "Education, Training, and Library Workers, All Other", "Arts, Design, Entertainment, Sports, and Media Occupations", "Art Directors", "Craft Artists", "Fine Artists, Including Painters, Sculptors, and Illustrators", "Multimedia Artists and Animators", "Artists and Related Workers, All Other", "Commercial and Industrial Designers", "Fashion Designers", "Floral Designers", "Graphic Designers", "Interior Designers", "Merchandise Displayers and Window Trimmers", "Set and Exhibit Designers", "Designers, All Other", "Producers and Directors", "Athletes and Sports Competitors", "Coaches and Scouts", "Choreographers", "Music Directors and Composers", "Radio and Television Announcers", "Broadcast News Analysts", "Reporters and Correspondents", "Public Relations Specialists", "Editors", "Technical Writers", "Writers and Authors", "Interpreters and Translators", "Media and Communication Workers, All Other", "Audio and Video Equipment Technicians", "Broadcast Technicians", "Sound Engineering Technicians", "Photographers", "Camera Operators, Television, Video, and Motion Picture", "Film and Video Editors", "Media and Communication Equipment Workers, All Other", "Healthcare Practitioners and Technical Occupations", "Chiropractors", "Dentists, General", "Oral and Maxillofacial Surgeons", "Dentists, All Other Specialists", "Dietitians and Nutritionists", "Optometrists", "Pharmacists", "Anesthesiologists", "Family and General Practitioners", "Internists, General", "Obstetricians and Gynecologists", "Pediatricians, General", "Psychiatrists", "Surgeons", "Physicians and Surgeons, All Other", "Physician Assistants", "Podiatrists", "Occupational Therapists", "Physical Therapists", "Radiation Therapists", "Recreational Therapists", "Respiratory Therapists", "Speech-Language Pathologists", "Exercise Physiologists", "Therapists, All Other", "Veterinarians", "Registered Nurses", "Nurse Anesthetists", "Nurse Midwives", "Nurse Practitioners", "Audiologists", "Health Diagnosing and Treating Practitioners, All Other", "Clinical Laboratory Technologists and Technicians", "Dental Hygienists", "Cardiovascular Technologists and Technicians", "Diagnostic Medical Sonographers", "Nuclear Medicine Technologists", "Radiologic Technologists", "Magnetic Resonance Imaging Technologists", "Emergency Medical Technicians and Paramedics", "Dietetic Technicians", "Pharmacy Technicians", "Psychiatric Technicians", "Respiratory Therapy Technicians", "Surgical Technologists", "Veterinary Technologists and Technicians", "Ophthalmic Medical Technicians", "Licensed Practical and Licensed Vocational Nurses", "Medical Records and Health Information Technicians", "Opticians, Dispensing", "Orthotists and Prosthetists", "Hearing Aid Specialists", "Health Technologists and Technicians, All Other", "Occupational Health and Safety Specialists", "Occupational Health and Safety Technicians", "Athletic Trainers", "Genetic Counselors", "Healthcare Practitioners and Technical Workers, All Other", "Healthcare Support Occupations", "Home Health Aides", "Psychiatric Aides", "Nursing Assistants", "Orderlies", "Occupational Therapy Assistants", "Occupational Therapy Aides", "Physical Therapist Assistants", "Physical Therapist Aides", "Massage Therapists", "Dental Assistants", "Medical Assistants", "Medical Equipment Preparers", "Medical Transcriptionists", "Pharmacy Aides", "Veterinary Assistants and Laboratory Animal Caretakers", "Phlebotomists", "Healthcare Support Workers, All Other", "Protective Service Occupations", "First-Line Supervisors of Correctional Officers", "First-Line Supervisors of Police and Detectives", "First-Line Supervisors of Protective Service Workers, All Other", "Firefighters", "Fire Inspectors and Investigators", "Correctional Officers and Jailers", "Detectives and Criminal Investigators", "Parking Enforcement Workers", "Police and Sheriff's Patrol Officers", "Transit and Railroad Police", "Private Detectives and Investigators", "Security Guards", "Crossing Guards", "Lifeguards, Ski Patrol, and Other Recreational Protective Service", "Protective Service Workers, All Other", "Food Preparation and Serving Related Occupations", "Chefs and Head Cooks", "First-Line Supervisors of Food Preparation and Serving Workers", "Cooks, Fast Food", "Cooks, Institution and Cafeteria", "Cooks, Restaurant", "Cooks, Short Order", "Cooks, All Other", "Food Preparation Workers", "Bartenders", "Combined Food Preparation and Serving Workers, Including Fast Food", "Counter Attendants, Cafeteria, Food Concession, and Coffee Shop", "Waiters and Waitresses", "Food Servers, Nonrestaurant", "Dining Room and Cafeteria Attendants and Bartender Helpers", "Dishwashers", "Hosts and Hostesses, Restaurant, Lounge, and Coffee Shop", "Food Preparation and Serving Related Workers, All Other", "Building and Grounds Cleaning and Maintenance Occupations", "First-Line Supervisors of Housekeeping and Janitorial Workers", "First-Line Supervisors of Landscaping, Lawn Service, and Groundskeeping Workers", "Janitors and Cleaners, Except Maids and Housekeeping Cleaners", "Maids and Housekeeping Cleaners", "Building Cleaning Workers, All Other", "Pest Control Workers", "Landscaping and Groundskeeping Workers", "Pesticide Handlers, Sprayers, and Applicators, Vegetation", "Tree Trimmers and Pruners", "Personal Care and Service Occupations", "First-Line Supervisors of Personal Service Workers", "Animal Trainers", "Nonfarm Animal Caretakers", "Ushers, Lobby Attendants, and Ticket Takers", "Amusement and Recreation Attendants", "Costume Attendants", "Locker Room, Coatroom, and Dressing Room Attendants", "Entertainment Attendants and Related Workers, All Other", "Funeral Attendants", "Morticians, Undertakers, and Funeral Directors", "Barbers", "Hairdressers, Hairstylists, and Cosmetologists", "Makeup Artists, Theatrical and Performance", "Manicurists and Pedicurists", "Shampooers", "Skincare Specialists", "Baggage Porters and Bellhops", "Concierges", "Tour and Travel Guides", "Childcare Workers", "Personal Care Aides", "Fitness Trainers and Aerobics Instructors", "Recreation Workers", "Residential Advisors", "Personal Care and Service Workers, All Other", "Sales and Related Occupations", "First-Line Supervisors of Retail Sales Workers", "First-Line Supervisors of Non-Retail Sales Workers", "Cashiers", "Counter and Rental Clerks", "Parts Salespersons", "Retail Salespersons", "Advertising Sales Agents", "Insurance Sales Agents", "Securities, Commodities, and Financial Services Sales Agents", "Travel Agents", "Sales Representatives, Services, All Other", "Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products", "Sales Representatives, Wholesale and Manufacturing, Except Technical and Scientific Products", "Demonstrators and Product Promoters", "Real Estate Brokers", "Real Estate Sales Agents", "Sales Engineers", "Telemarketers", "Sales and Related Workers, All Other", "Office and Administrative Support Occupations", "First-Line Supervisors of Office and Administrative Support Workers", "Switchboard Operators, Including Answering Service", "Telephone Operators", "Communications Equipment Operators, All Other", "Bill and Account Collectors", "Billing and Posting Clerks", "Bookkeeping, Accounting, and Auditing Clerks", "Payroll and Timekeeping Clerks", "Procurement Clerks", "Tellers", "Financial Clerks, All Other", "Brokerage Clerks", "Correspondence Clerks", "Court, Municipal, and License Clerks", "Credit Authorizers, Checkers, and Clerks", "Customer Service Representatives", "Eligibility Interviewers, Government Programs", "File Clerks", "Hotel, Motel, and Resort Desk Clerks", "Interviewers, Except Eligibility and Loan", "Library Assistants, Clerical", "Loan Interviewers and Clerks", "New Accounts Clerks", "Order Clerks", "Human Resources Assistants, Except Payroll and Timekeeping", "Receptionists and Information Clerks", "Reservation and Transportation Ticket Agents and Travel Clerks", "Information and Record Clerks, All Other", "Cargo and Freight Agents", "Couriers and Messengers", "Police, Fire, and Ambulance Dispatchers", "Dispatchers, Except Police, Fire, and Ambulance",
        "Postal Service Clerks", "Postal Service Mail Carriers", "Postal Service Mail Sorters, Processors, and Processing Machine Operators", "Production, Planning, and Expediting Clerks", "Shipping, Receiving, and Traffic Clerks", "Stock Clerks and Order Fillers", "Weighers, Measurers, Checkers, and Samplers, Recordkeeping", "Executive Secretaries and Executive Administrative Assistants", "Legal Secretaries", "Medical Secretaries", "Secretaries and Administrative Assistants, Except Legal, Medical, and Executive", "Computer Operators", "Data Entry Keyers", "Word Processors and Typists", "Desktop Publishers", "Insurance Claims and Policy Processing Clerks", "Mail Clerks and Mail Machine Operators, Except Postal Service", "Office Clerks, General", "Office Machine Operators, Except Computer", "Proofreaders and Copy Markers", "Statistical Assistants", "Office and Administrative Support Workers, All Other", "Farming, Fishing, and Forestry Occupations", "First-Line Supervisors of Farming, Fishing, and Forestry Workers", "Agricultural Inspectors", "Farmworkers and Laborers, Crop, Nursery, and Greenhouse", "Forest and Conservation Workers", "Construction and Extraction Occupations", "Supervisors of Construction and Extraction Workers", "Boilermakers", "Brickmasons and Blockmasons", "Stonemasons", "Carpenters", "Tile and Marble Setters", "Cement Masons and Concrete Finishers", "Terrazzo Workers and Finishers", "Construction Laborers", "Paving, Surfacing, and Tamping Equipment Operators", "Pile-Driver Operators", "Operating Engineers and Other Construction Equipment Operators", "Drywall and Ceiling Tile Installers", "Tapers", "Electricians", "Glaziers", "Insulation Workers, Floor, Ceiling, and Wall", "Painters, Construction and Maintenance", "Paperhangers", "Pipelayers", "Plumbers, Pipefitters, and Steamfitters", "Plasterers and Stucco Masons", "Reinforcing Iron and Rebar Workers", "Roofers", "Sheet Metal Workers", "Structural Iron and Steel Workers", "Helpers--Brickmasons, Blockmasons, Stonemasons, and Tile and Marble Setters", "Helpers--Carpenters", "Helpers--Electricians", "Helpers--Painters, Paperhangers, Plasterers, and Stucco Masons", "Helpers--Pipelayers, Plumbers, Pipefitters, and Steamfitters", "Helpers, Construction Trades, All Other", "Construction and Building Inspectors", "Elevator Installers and Repairers", "Fence Erectors", "Hazardous Materials Removal Workers", "Septic Tank Servicers and Sewer Pipe Cleaners", "Miscellaneous Construction and Related Workers", "Earth Drillers, Except Oil and Gas", "Explosives Workers, Ordnance Handling Experts, and Blasters", "Installation, Maintenance, and Repair Occupations", "First-Line Supervisors of Mechanics, Installers, and Repairers", "Computer, Automated Teller, and Office Machine Repairers", "Telecommunications Equipment Installers and Repairers, Except Line Installers", "Electric Motor, Power Tool, and Related Repairers", "Electrical and Electronics Installers and Repairers, Transportation Equipment", "Electrical and Electronics Repairers, Commercial and Industrial Equipment", "Electrical and Electronics Repairers, Powerhouse, Substation, and Relay", "Electronic Equipment Installers and Repairers, Motor Vehicles", "Electronic Home Entertainment Equipment Installers and Repairers", "Security and Fire Alarm Systems Installers", "Aircraft Mechanics and Service Technicians", "Automotive Body and Related Repairers", "Automotive Service Technicians and Mechanics", "Bus and Truck Mechanics and Diesel Engine Specialists", "Mobile Heavy Equipment Mechanics, Except Engines", "Motorcycle Mechanics", "Outdoor Power Equipment and Other Small Engine Mechanics", "Bicycle Repairers", "Tire Repairers and Changers", "Mechanical Door Repairers", "Heating, Air Conditioning, and Refrigeration Mechanics and Installers", "Home Appliance Repairers", "Industrial Machinery Mechanics", "Maintenance Workers, Machinery", "Millwrights", "Telecommunications Line Installers and Repairers", "Camera and Photographic Equipment Repairers", "Medical Equipment Repairers", "Musical Instrument Repairers and Tuners", "Watch Repairers", "Maintenance and Repair Workers, General", "Coin, Vending, and Amusement Machine Servicers and Repairers", "Commercial Divers", "Locksmiths and Safe Repairers", "Riggers", "Helpers--Installation, Maintenance, and Repair Workers", "Installation, Maintenance, and Repair Workers, All Other", "Production Occupations", "First-Line Supervisors of Production and Operating Workers", "Structural Metal Fabricators and Fitters", "Assemblers and fabricators, all other, including team assemblers+(OES-specific code and title)", "Bakers", "Butchers and Meat Cutters", "Meat, Poultry, and Fish Cutters and Trimmers", "Slaughterers and Meat Packers", "Food and Tobacco Roasting, Baking, and Drying Machine Operators and Tenders", "Food Batchmakers", "Food Cooking Machine Operators and Tenders", "Food Processing Workers, All Other", "Computer-Controlled Machine Tool Operators, Metal and Plastic", "Computer Numerically Controlled Machine Tool Programmers, Metal and Plastic", "Extruding and Drawing Machine Setters, Operators, and Tenders, Metal and Plastic", "Rolling Machine Setters, Operators, and Tenders, Metal and Plastic", "Cutting, Punching, and Press Machine Setters, Operators, and Tenders, Metal and Plastic", "Grinding, Lapping, Polishing, and Buffing Machine Tool Setters, Operators, and Tenders, Metal and Plastic", "Lathe and Turning Machine Tool Setters, Operators, and Tenders, Metal and Plastic", "Milling and Planing Machine Setters, Operators, and Tenders, Metal and Plastic", "Machinists", "Model Makers, Metal and Plastic", "Molding, Coremaking, and Casting Machine Setters, Operators, and Tenders, Metal and Plastic", "Multiple Machine Tool Setters, Operators, and Tenders, Metal and Plastic", "Tool and Die Makers", "Welders, Cutters, Solderers, and Brazers", "Welding, Soldering, and Brazing Machine Setters, Operators, and Tenders", "Heat Treating Equipment Setters, Operators, and Tenders, Metal and Plastic", "Prepress Technician and Workers", "Printing Press Operators", "Print Binding and Finishing Workers", "Laundry and Dry-Cleaning Workers", "Pressers, Textile, Garment, and Related Materials", "Sewing Machine Operators", "Shoe and Leather Workers and Repairers", "Sewers, Hand", "Tailors, Dressmakers, and Custom Sewers", "Textile Bleaching and Dyeing Machine Operators and Tenders", "Textile Cutting Machine Setters, Operators, and Tenders", "Textile Knitting and Weaving Machine Setters, Operators, and Tenders", "Textile Winding, Twisting, and Drawing Out Machine Setters, Operators, and Tenders", "Fabric and Apparel Patternmakers", "Upholsterers", "Textile, Apparel, and Furnishings Workers, All Other", "Cabinetmakers and Bench Carpenters", "Furniture Finishers", "Woodworking Machine Setters, Operators, and Tenders, Except Sawing", "Power Distributors and Dispatchers", "Power Plant Operators", "Stationary Engineers and Boiler Operators", "Water and Wastewater Treatment Plant and System Operators", "Chemical Equipment Operators and Tenders", "Separating, Filtering, Clarifying, Precipitating, and Still Machine Setters, Operators, and Tenders", "Crushing, Grinding, and Polishing Machine Setters, Operators, and Tenders", "Grinding and Polishing Workers, Hand", "Mixing and Blending Machine Setters, Operators, and Tenders", "Cutters and Trimmers, Hand", "Cutting and Slicing Machine Setters, Operators, and Tenders", "Extruding, Forming, Pressing, and Compacting Machine Setters, Operators, and Tenders", "Inspectors, Testers, Sorters, Samplers, and Weighers", "Jewelers and Precious Stone and Metal Workers", "Dental Laboratory Technicians", "Medical Appliance Technicians", "Ophthalmic Laboratory Technicians", "Packaging and Filling Machine Operators and Tenders", "Coating, Painting, and Spraying Machine Setters, Operators, and Tenders", "Painters, Transportation Equipment", "Painting, Coating, and Decorating Workers", "Photographic Process Workers and Processing Machine Operators", "Adhesive Bonding Machine Operators and Tenders", "Cleaning, Washing, and Metal Pickling Equipment Operators and Tenders", "Molders, Shapers, and Casters, Except Metal and Plastic", "Paper Goods Machine Setters, Operators, and Tenders", "Helpers--Production Workers", "Production Workers, All Other", "Transportation and Material Moving Occupations", "Aircraft Cargo Handling Supervisors", "Airline Pilots, Copilots, and Flight Engineers", "Commercial Pilots", "Airfield Operations Specialists", "Flight Attendants", "Ambulance Drivers and Attendants, Except Emergency Medical Technicians", "Bus Drivers, Transit and Intercity", "Bus Drivers, School or Special Client", "Driver/Sales Workers", "Heavy and Tractor-Trailer Truck Drivers", "Light Truck or Delivery Services Drivers", "Taxi Drivers and Chauffeurs", "Motor Vehicle Operators, All Other", "Sailors and Marine Oilers", "Captains, Mates, and Pilots of Water Vessels", "Ship Engineers", "Parking Lot Attendants", "Automotive and Watercraft Service Attendants", "Traffic Technicians", "Transportation Inspectors", "Transportation Attendants, Except Flight Attendants", "Transportation Workers, All Other", "Conveyor Operators and Tenders", "Crane and Tower Operators", "Excavating and Loading Machine and Dragline Operators", "Industrial Truck and Tractor Operators", "Cleaners of Vehicles and Equipment", "Laborers and Freight, Stock, and Material Movers, Hand", "Machine Feeders and Offbearers", "Packers and Packagers, Hand", "Refuse and Recyclable Material Collectors", "Material Moving Workers, All Other"]
});


