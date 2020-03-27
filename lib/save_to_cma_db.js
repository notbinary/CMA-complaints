
const createFormData = require('../lib/createFormData');
const { Client } = require('pg');
const createReferenceNumber = require('./utils').createReferenceNumber;

module.exports = async  (data,req) => {
    try {
        const { fields, positions, json, values } = createFormData(data);
        var sql = "INSERT INTO cma_responses(" + fields + ") VALUES (" + positions + ") returning id;"
        const query = {
            text: sql,
            values: values
        }
        console.log('inserting into database',json);
        console.log(req.app.get('env') );
        console.log("ssl?" + (process.env.NODE_ENV === 'production'));
        let reference = '';
        try {
            console.log('Connecting to database');
            const client = new Client({
                connectionString: process.env.HEROKU_POSTGRESQL_RED_URL || process.env.DATABASE_URL,
                ssl: (process.env.NODE_ENV === 'production'),
            });
            client.connect();
            const res = await client.query(query);
            const id = res.rows[0].id;
            reference = createReferenceNumber(id);
            console.log('successfully inserted into database id '+id+' and updating with reference number',reference);

            //use the id to create a reference in the form CMA00000012 (8 digits so up to 99,999,999,999 entries i.e. 99 million)
            const update_sql = `UPDATE cma_responses SET reference_number=$1 WHERE id=${id};`;
            const update_query = {
                text: update_sql,
                values: [reference]
            }
            await client.query(update_query);
        }
        catch (err) {
            throw 'Failed to submit query to database';
        }
        return reference;
    }
    catch{
       throw 'Failed to connect to database';
    }
}