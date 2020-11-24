const express = require('express');
const app = express();
const fs = require('fs');
let config = JSON.parse(fs.readFileSync('config.json'));


app.get('/list',(req, res) => {
    html_ret = "<h1>Ping results</h1>"; 
    fs.readdir(config.pingDirectory, function(err, items) {     
        for (var i=0; i<items.length; i++) {
            if(items[i].substr(items[i].length - 4) == ".txt" || items[i].substr(items[i].length - 4) == ".csv"){
                html_ret += "<a href=/download/?dl=" + items[i]+ ">" + items[i] + "</a><br>";
            }
        }

        html_ret += "<br><br><h1>Iperf results</h1><br>";
    });    
    fs.readdir(config.iperfDirectory, function(err, items) {   
        for (var i=0; i<items.length; i++) {
            if(items[i].substr(items[i].length - 4) == ".txt" || items[i].substr(items[i].length - 4) == ".csv"){
                html_ret += "<a href=/download/?dl=iperf_results/" + items[i]+ ">" + items[i] + "</a><br>";
            }
        }
        res.send(html_ret);
    });
});


app.get('/file-list', (request, result) => {
    fs.readdir(config.pingDirectory, function(err, items) { 
        file_list = []    
        for (var i=0; i<items.length; i++) {
            if(items[i].substr(items[i].length - 4) == ".txt" || items[i].substr(items[i].length - 4) == ".csv"){
                file_list.push(items[i]);
            }
        }
        fs.readdir(config.iperfDirectory, function(err, items) {   
            for (var i=0; i<items.length; i++) {
                if(items[i].substr(items[i].length - 4) == ".txt" || items[i].substr(items[i].length - 4) == ".csv"){
                    file_list.push(items[i]);
                }
            }
            result.send(file_list);
        });
    });  
});

app.get('/download',(req, res) => {
    let url = req.query.dl;
    res.download(settings.save_dir + "/" + url); // Set disposition and send it.
});


app.listen(3001, () => console.log('App listening on port 3000!'));
