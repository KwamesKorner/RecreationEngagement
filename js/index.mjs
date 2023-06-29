import { DynamoDB } from "@aws-sdk/client-dynamodb"; // ES6 import
// const { DynamoDB } = require("@aws-sdk/client-dynamodb"); // CommonJS import

// Full DynamoDB Client
const client = new DynamoDB({});

import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
// const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb"); // CommonJS import

// Bare-bones document client
const ddbDocClient = DynamoDBDocument.from(client); // client is DynamoDB client

const accountSid = "ACf8d0f691faa3c1557b9e901ade2450dc";
const authToken = process.env.AUTH_TOKEN;
import twilio from "twilio";
// const { Twilio } = twilio
const twilioClient = twilio(accountSid, authToken);


export const handler = (event, context, callback) => {
    // if (!event.requestContext.authorizer) {
    //   errorResponse('Authorization not configured', context.awsRequestId, callback);
    //   return;
    // }

    console.log('Received event ' + JSON.stringify(event));

    // Because we're using a Cognito User Pools authorizer, all of the claims
    // included in the authentication token are provided in the request context.
    // This includes the username as well as other attributes.
    // const username = event.requestContext.authorizer.claims['cognito:username'];

    // The body field of the event in a proxy integration is a raw string.
    // In order to extract meaningful values, we need to first parse this string
    // into an object. A more robust implementation might inspect the Content-Type
    // header first and use a different parsing strategy based on that value.
    const requestBody = event;
    
    console.log(requestBody);
    
    const name = requestBody.name;
    
    const student_name = requestBody.student_name;

    const phone_number = requestBody.phone_number;

    const user_email = requestBody.user_email;
    
    const communication_consent = requestBody.communication_consent;

    recordStudent(name, student_name, phone_number, user_email, communication_consent).then(() => {
        // You can use the callback function to provide a return value from your Node.js
        // Lambda functions. The first parameter is used for failed invocations. The
        // second parameter specifies the result data of the invocation.

        // Because this Lambda function is called by an API Gateway proxy integration
        // the result object must use the following structure.
        
        callback(null, {
            statusCode: 201,
            body: JSON.stringify({
                name: name,
                student_name: student_name,
                phone_number: phone_number,
                email: user_email,
                communication_consent: communication_consent
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
        });
        if (communication_consent === true) {
            twilioClient.messages
            .create({
                body: "KX Technology Communications: Thank you for enrolling your child(ren) in the Python Game Development Class! You are now enrolled in text notificaitons for this class. To opt out text STOP. Msg&Data Rates May Apply.",
                from: '+12057494326',
                to: '+1' + String(phone_number)
            }).then(message => console.log(message.sid));
        }
    }).catch((err) => {
        console.error(err);

        // If there is an error during processing, catch it and return
        // from the Lambda function successfully. Specify a 500 HTTP status
        // code and provide an error message in the body. This will provide a
        // more meaningful error response to the end client.
        errorResponse(err.message, context.awsRequestId, callback)
    });
};

function recordStudent(name, student_name, phone_number, user_email, communication_consent) {
    return ddbDocClient.put({
        TableName: 'FWCC-Classes',
        Item: {
            class: "Intro to Game Development In Python",
            activityCode: "14601",
            sectionCode: "106A",
            classTitle: "Intro to Game Development In Python",
            name: name,
            student_name: student_name,
            phoneNumber: phone_number,
            email: user_email,
            communication_consent: communication_consent
        },
    });
}



function errorResponse(errorMessage, awsRequestId, callback) {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
