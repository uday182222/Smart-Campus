const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    console.log('Transport update event:', JSON.stringify(event, null, 2));
    
    try {
        const { routeId, stopId, status, timestamp, helperId } = JSON.parse(event.body);
        
        // Update transport route status
        const updateParams = {
            TableName: 'SmartCampus-TransportRoutes',
            Key: {
                routeId: routeId
            },
            UpdateExpression: 'SET stops.#stopId.status = :status, stops.#stopId.updatedAt = :timestamp, stops.#stopId.helperId = :helperId',
            ExpressionAttributeNames: {
                '#stopId': stopId
            },
            ExpressionAttributeValues: {
                ':status': status,
                ':timestamp': timestamp,
                ':helperId': helperId
            },
            ReturnValues: 'ALL_NEW'
        };
        
        const result = await dynamodb.update(updateParams).promise();
        
        // Send notification to parents
        await sendNotificationToParents(routeId, stopId, status);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            body: JSON.stringify({
                message: 'Transport update successful',
                data: result.Attributes
            })
        };
        
    } catch (error) {
        console.error('Error updating transport:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

async function sendNotificationToParents(routeId, stopId, status) {
    try {
        // Get parents subscribed to this route
        const queryParams = {
            TableName: 'SmartCampus-Users',
            IndexName: 'RoleIndex',
            KeyConditionExpression: 'role = :role',
            FilterExpression: 'contains(transportRouteIds, :routeId)',
            ExpressionAttributeValues: {
                ':role': 'parent',
                ':routeId': routeId
            }
        };
        
        const parents = await dynamodb.query(queryParams).promise();
        
        // Send push notifications
        for (const parent of parents.Items) {
            const message = {
                Message: JSON.stringify({
                    default: `Bus ${routeId} has ${status} at stop ${stopId}`,
                    APNS: JSON.stringify({
                        aps: {
                            alert: {
                                title: 'Transport Update',
                                body: `Bus ${routeId} has ${status} at stop ${stopId}`
                            },
                            badge: 1
                        }
                    })
                }),
                TopicArn: `arn:aws:sns:us-east-1:123456789012:smart-campus-parent-${parent.userId}`
            };
            
            await sns.publish(message).promise();
        }
        
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}
