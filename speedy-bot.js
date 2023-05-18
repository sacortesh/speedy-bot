
const axios = require('axios');
const cron = require("node-cron");
const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const notifier = require('node-notifier');
const creds = require('./glomo-ar-availability-mon-8bffbc976a93.json');


const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

let lastExecution = -1;
let lastTimestamp = undefined;
let isFirstExecution = true;

const STATUS_OK = '🟢';
const STATUS_ERROR = '🔥';

function logToFile(message) {
    const date = new Date().toISOString().split("T")[0];
    const fileName = `${date}.txt`;
    const filePath = path.join(__dirname, 'logs', fileName);


    fs.appendFile(filePath, `[${new Date((new Date().getTime() - (5 * 60 * 60 * 1000))).toISOString()}] ${message}\n`, (err) => {
        if (err) throw err;
    });
}

async function performMonitoring() {
    let step = 'init';
    let canStoreResults = false;
    let flagSameResult = false;

    let serviceResults = initResponseObject()

    let sheet;


    try {
        step = 'google-docs-init';
        // Connect to the Google Spreadsheet
        sheet = await configureGoogleSpreadsheetsConnection(sheet);
        logToFile("Records: " + sheet.rowCount);
        canStoreResults = true;

        // todo create methoid that selects/ creates appropiate sheet for the current day

        step = 'request-validations';



        logToFile('Obtained Validations ' + responseValidations.status);


        logToFile('Successfully extracted pkcs7 key');



        step = 'granting-ticket';

        logToFile('Obtained GT ' + response.status);

        step = 'finished';

    } catch (error) {
        let message = '';
        if (step === 'google-docs-init') {
            message = `Error in google docs database, check logs`;
        } else {
            message = `Buenas, login caido en ${step}`;
            if (lastExecution === 0) {
                flagSameResult = true;
            }
            updateStatus(0);
            logToFile(error);
            serviceResults.statusCode = error.response.status;
            serviceResults.errorMessage = 'Error';
        }


        logToFile(`Error making request: ${error}`);
    } finally {
        if (canStoreResults) {
            let date = new Date();
            let prefix;
            let hours = '';
            let minutes = '';


            lastTimestamp = date;
            const argentinaTimestamp = new Date(date.getTime() + (2 * 60 * 60 * 1000)).toLocaleString('es');
            const colombianTimestamp = new Date(date.getTime()).toLocaleString('es');

            // Write the information to the Google Spreadsheet
            await sheet.addRow({
                timestampAR: argentinaTimestamp,
                timestampCO: colombianTimestamp,
                lastAttemptedService: serviceResults.lastAttemptedService,
                statusCode: serviceResults.statusCode,
                errorMessage: serviceResults.errorMessage,
                eventDescription: prefix,
                hoursOfEvent: hours,
                minutesOfEvent: minutes,
            });
        }
    }
}

//cron.schedule("*/2 * * * *", performMonitoring);
performMonitoring();

async function configureGoogleSpreadsheetsConnection(sheet) {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    //Todo create new bot
    await doc.useServiceAccountAuth(creds, "agusbot@glomo-ar-availability-mon.iam.gserviceaccount.com");

    await doc.loadInfo();

    logToFile("Opening: " + doc.title);

    sheet = doc.sheetsByIndex[0];
    return sheet;
}

function initResponseObject() {
    return {
        timestamp: '',
        downloadSpeed: '',
        uploadSpeed: '',
        ping: '',
        testServer: '',
    };
}

