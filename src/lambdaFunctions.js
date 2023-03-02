import AWS from 'aws-sdk';
import vars from './config.js';

AWS.config.update(
  vars,
);

export const invokeLambdaFunction = (functionName, payload) => {
    const lambda = new AWS.Lambda();
    const params = {
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    };
    return lambda.invoke(params).promise();
  };