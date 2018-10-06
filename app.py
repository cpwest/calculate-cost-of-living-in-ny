import os
import pandas as pd
import numpy as np
import plotly
import plotly.plotly as py
import plotly.graph_objs as go

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, inspect

from flask import Flask, jsonify, render_template, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__, static_url_path='/static')

#################################################
# Database Setup
#################################################

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db/data.sqlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS "] = True

engine = create_engine("sqlite:///db/data.sqlite", echo=False)

# graph1Plot = Markup(graph1Plot)

db = SQLAlchemy(app)

# reflect an existing database into a new model
Base = automap_base()

# reflect the tables
Base.prepare(db.engine, reflect=True)

# Save references to each table
wages = Base.classes.wages
rent = Base.classes.rent
nycrent = Base.classes.nycrent

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/map")
def map():
    return render_template("map.html")


@app.route("/dashboard")
def dashboard_page():
    profession = request.args.get('profession')
    income = request.args.get('income')
    return render_template("dashboard.html", profession=profession, income=income)

@app.route("/bar")
def bar_page():
    profession = request.args.get('profession')
    income = request.args.get('income')
    return render_template("bar.html", profession=profession, income=income)

@app.route("/line")
def line_page():
    profession = request.args.get('profession')
    income = request.args.get('income')
    return render_template("line.html", profession=profession, income=income)

# Returns json list of all professions from database
# Information is returned from title column of wages table
@app.route("/professions")
def professions_data():
    # Retrieve median income for profession from database
    stmt = db.session.query(wages).statement
    df = pd.read_sql_query(stmt, db.session.bind)
    # Create a dictionary
    data = {
        "professions": df["Title"].values.tolist()
    }
    return jsonify(data)


# Returns wages information in json format based on profession
# If profession is not found empty json object is returned
@app.route("/wages/<profession>")
def wages_profession(profession):
    print(profession)
    stmt = db.session.query(wages).statement
    df = pd.read_sql_query(stmt, db.session.bind)
    sample_data = df.loc[df['Title'] == profession, ["Title",
                                                     "Employment",
                                                     "Mean",
                                                     "Median",
                                                     "Entry",
                                                     "Experienced"]]
    if sample_data.empty:
        return jsonify({})

    # Format the data to send as json
    data = {
        "Title": sample_data['Title'].values[0],
        "Employment": sample_data['Employment'].values[0],
        "Mean": sample_data['Mean'].values[0],
        "Median": sample_data['Median'].values[0],
        "Entry": sample_data['Entry'].values[0],
        "Experienced": sample_data['Experienced'].values[0]
    }
    return jsonify(data)


@app.route("/neighborhoods")
def neighborhoods_data():
    stmt = db.session.query(rent).statement
    df = pd.read_sql_query(stmt, db.session.bind)
    sample_data = df.loc[df['City'] == "New York", ["RegionName",
                                                    "CountyName",
                                                    "SizeRank"]]
    if sample_data.empty:
        return jsonify({})
    # Format the data to send as json
    data = {
        "RegionName": sample_data['RegionName'].values.tolist(),
        "County": sample_data['CountyName'].values.tolist(),
        "Size": sample_data['SizeRank'].values.tolist()
    }
    return jsonify(data)


@app.route("/neighborhoods/<name>")
def hood_data(name):
    """Return mean rent for a neighborhood"""
    sel = [
        rent.RegionName,  # neighborhood
        rent.City,  # city
        rent.State,  # state
        rent.Aug2018  # most recent mean rent
    ]

    sample_data = db.session.query(*sel).filter(rent.City == "New York").filter(rent.RegionName == name).all()
    # create dictionary entry for each row of neighborhood info
    # neighborhood_data = {}
    #
    # for result in nycNeighborhoods:
    #     neighborhood_data["RegionName"] = result[0]
    #     neighborhood_data["City"] = result[1]
    #     neighborhood_data["State"] = result[2]
    #     neighborhood_data["Aug2018"] = result[3]
    # print(neighborhood_data)

    stmt = db.session.query(rent).statement
    df = pd.read_sql_query(stmt, db.session.bind)
    sample_data = df.loc[df['RegionName'] == name, ["RegionName",
                                                    "City",
                                                    "State",
                                                    "Aug2018"]]
    data = {
        "RegionName": sample_data['RegionName'].values.tolist()[0],
        "City": sample_data['City'].values.tolist()[0],
        "State": sample_data['State'].values.tolist()[0],
        "Aug2018": sample_data['Aug2018'].values.tolist()[0]
    }

    return jsonify(data)


@app.route("/linedata")
def line_data():

    # testing this out
    stmt = db.session.query(nycrent).statement
    df = pd.read_sql_query(stmt, db.session.bind)
    sample_data = df.loc[df['City'] == "New York", ["City",
                                                    "RegionName",
                                                    "Jan2017",
                                                    "Feb2017",
                                                    "Mar2017",
                                                    "Apr2017",
                                                    "May2017",
                                                    "Jun2017",
                                                    "Jul2017",
                                                    "Aug2017",
                                                    "Sep2017",
                                                    "Oct2017",
                                                    "Nov2017",
                                                    "Dec2017"]]
    if sample_data.empty:
        return jsonify({})

    data = {
        "City": sample_data['City'].values.tolist(),
        "RegionName": sample_data['RegionName'].values.tolist(),
        "Jan2017": sample_data['Jan2017'].values.tolist(),
        "Feb2017": sample_data['Feb2017'].values.tolist(),
        "Mar2017": sample_data['Mar2017'].values.tolist(),
        "Apr2017": sample_data['Apr2017'].values.tolist(),
        "May2017": sample_data['May2017'].values.tolist(),
        "Jun2017": sample_data['Jun2017'].values.tolist(),
        "Jul2017": sample_data['Jul2017'].values.tolist(),
        "Aug2017": sample_data['Aug2017'].values.tolist(),
        "Sep2017": sample_data['Sep2017'].values.tolist(),
        "Oct2017": sample_data['Oct2017'].values.tolist(),
        "Nov2017": sample_data['Nov2017'].values.tolist(),
        "Dec2017": sample_data['Dec2017'].values.tolist(),
    }
    return jsonify(data)


@app.route("/barchart")
def bar_chart():
    profession = request.args.get('profession')

    stmt = db.session.query(wages).statement
    df = pd.read_sql_query(stmt, db.session.bind)
    sample_data = df.loc[df['Title'] == profession, ["Title",
                                                     "Mean",
                                                     "Entry",
                                                     "Experienced",
                                                     "Employment",
                                                     "SOCCode"]]
    if sample_data.empty:
        return jsonify({})
    data = {
        "Title": sample_data['Title'].values.tolist(),
        "Mean": sample_data['Mean'].values.tolist(),
        "Entry": sample_data['Entry'].values.tolist(),
        "Experienced": sample_data['Experienced'].values.tolist(),
        "Employment": sample_data['Employment'].values.tolist(),
        "SOCCode": sample_data['SOCCode'].values.tolist()
    }
    return jsonify(data)

# Zillow.csv code
zillowfilepath = os.path.join(os.path.dirname(__file__),'db/zillow.csv')
open_read = open(zillowfilepath,'r')
page =''

while True:
    read_data = open_read.readline()
    page += '<p>%s</p>' % read_data
    if open_read.readline() == '':
        break


@app.route("/readcsv")
def read_csv():
    return page

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='127.0.0.1', port=5000)
