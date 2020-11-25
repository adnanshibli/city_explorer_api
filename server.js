"use strict";
//Aplication Depenencies (require)
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const superagent = require('superagent');
let pg = require('pg');
const { json } = require('express');
const client = new pg.Client(process.env.DATABASE_URL);


//application setup (port,server,use cors)
const PORT = process.env.PORT || 3000;
const server = express();
server.use(cors());

//Application Routes
server.get('/location', locationHandlerFunc)
server.get('/weather', weathHanadlerFun);
server.get('*', allRoutes);
server.use(errorHandler);


// server.get('/test',testLocationHandler);
// function testLocationHandler(req,res){
//     let cityName=res.query.city;
//     // let form=res.query.form;
//     // let lat=res.query.lat;
//     // let lon=res.query.lon;
//     // INSERT INTO locations (search_quer,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4)`
//     let SQL= `SELECT * FORM locations WHERE search_quer=${cityName};`// query
//     client.query(SQL) //to link it to database
//     .then((result)=>{ 
//         res.send(result.rows);
//     })
// }



function locationHandlerFunc(req, res) {
    let cityName = req.query.city;
    let selectuery = `SELECT * FROM locations WHERE search_query='${cityName}';`;
    client.query(selectuery)
    .then(result => {
        // console.log('hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii'+result.rowCount)
        // return result.rows;  
           if(result.rowCount){
            console.log(result.rows);
            res.json(result.rows[0]);
    }
        else{
            console.log('hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
            getCityLocation(cityName,req,res)
            .then(locaData => { //return data from location IQ
                res.status(200).json(locaData);
            })
            .catch(() => {
                errorHandler('Something went wrong', req, res);
            });
        }
    })
    .catch(() => {
        errorHandler('Something went wrong', req, res);
    });
   
}




 
function getCityLocation(cityName,req,res) {
    let GEO_API_KEY = process.env.GEO_API_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${GEO_API_KEY}&q=${cityName}&format=json`;
        return superagent.get(url)//bring me the data from url
            .then(myData => {
                  // save to the DB
                 let formatted_query = myData.body[0].display_name;
                 let longitude = myData.body[0].lon;
                 let latitude = myData.body[0].lat;
                 let insertLocation = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4)`;
                let safeValues = [cityName,formatted_query, latitude, longitude];
                client.query(insertLocation, safeValues)
                .then(()=>{
                    res.send('your data has been added successfully!!');
                })
                console.log(myData.body)
                let locObj = new Location(cityName, myData.body);//------ just the impotrtant data-------
                return locObj//to the client
            })
            .catch(() => {
                errorHandler('Something went wrong',req,res);
            });
    
}


function Location(city, locData) {
    this.search_query = city;
    this.formatted_query = locData[0].display_name;
    this.latitude = locData[0].lat;
    this.longitude = locData[0].lon;
}



function Weather(day) {
    this.forecast = day.weather.description;
    this.time = day.datetime;
}


function weathHanadlerFun(req, res) {
    let cityName = req.query.search_query;
    // console.log(cityName);
    let lon = req.query.longitude;
    let lat = req.query.latitude;
    let WEATHER_API_KEY = process.env.WEATHER_API_KEY;
    let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}&days=5`;

    superagent.get(weatherURL)
        .then(weatherData => {
            let weatherArray = weatherData.body.data.map(element => new Weather(element));
            res.json(weatherArray);
        })

        .catch(() => {
            errorHandler('Soperagnet faced a truble', req, res);
        });

}




//handle all routes
function allRoutes(req, res) {
    res.status(404).send('not found')
}




function errorHandler(req, res) {
    res.status(500).send(error);
}



client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`listining on port ${PORT}`);
        });
    });