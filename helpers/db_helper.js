const mysql = require('mysql');
const env = require('../config/environments');

//TODO: Can rework this as a connection pool
let connection;

function handleDisconnect() {
    connection = mysql.createConnection(env.db_config);

    connection.connect(function(err) {
        if(err) {
            console.log('Error when connecting to DB: ', err);
            setTimeout(handleDisconnect, 2000);
        }
    });

    connection.on('error', function(err) {
        console.log('Problem with DB connection: ', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

module.exports = {
    append_to_log: function (entry_text, user = "DEV-LOG"){
        return new Promise(function(resolve, reject) {
            let user_entry = user ? user + " - " : "";
            let final_entry = user_entry + entry_text;

            try {
                let entry = {
                    date: new Date(),
                    message: final_entry,
                    service: "epic-shelter",
                    environment: env.secrets.environment
                };
                connection.query('INSERT INTO logs SET ?', entry, function (error, results, fields) {
                    if (error) {
                        console.log(error);
                        reject(error);
                    }
                    resolve(results);
                });
            } catch (e) {
                console.log(e);
                reject(e);
            }
            console.log(final_entry)
        });
    },
    query_logs: function(page_size, page_num) {
        return new Promise(function(resolve, reject) {
            let offset = (page_num - 1) * page_size;

            connection.query('SELECT * FROM logs WHERE environment = ? ORDER by ID DESC LIMIT ? OFFSET ?',
                [env.secrets.environment, page_size, offset],
                function (error, results, fields) {
                    if (error) {
                        if(env.secrets.environment === "dev")
                            console.log(error);
                        reject(error)
                    } else {
                        resolve({
                            log_entries: results,
                            page_size: page_size,
                            page_num: page_num
                        })
                    }
                }
            );
        });
    },
    renderInitialMotionAsset: function (query){
        return new Promise(function(resolve, reject) {
            try {
                let query = 'select count(*) as count from images;';

                connection.query(query, function (error, results, fields) {
                    if (error) throw error;

                    const record = results[0]; // select first row

                    // Got no BLOB data
                    if (record === undefined)
                        console.log("No result found getting record record.");
                    else
                        console.log("Motion Assets Count: " + record.count);

                    resolve(record.count);

                });
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    },
    sendMotionAssetById: function (imageId){
        return new Promise(function(resolve, reject) {
            try {
                let query = `select * from images where ID = ?`;

                connection.query(query, [imageId], function (error, results, fields) {
                    if (error) throw error;

                    const record = results[0]; // select first row

                    // Got no BLOB data
                    if (record === undefined) {
                        console.log("No result -- ID not in DB?");
                        reject(new Error("Record not found."))
                    } else {
                        console.log("BLOB data found.");
                        resolve(record);
                    }
                });
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }
}