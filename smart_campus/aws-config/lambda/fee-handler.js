const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    console.log('Fee processing event:', JSON.stringify(event, null, 2));
    
    try {
        const { action, feeData } = JSON.parse(event.body);
        
        switch (action) {
            case 'createFeeStructure':
                return await createFeeStructure(feeData);
            case 'recordPayment':
                return await recordPayment(feeData);
            case 'generateFeeDues':
                return await generateFeeDues(feeData);
            case 'sendReminders':
                return await sendFeeReminders(feeData);
            default:
                throw new Error('Invalid action');
        }
        
    } catch (error) {
        console.error('Error processing fee:', error);
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

async function createFeeStructure(feeData) {
    const params = {
        TableName: 'SmartCampus-FeeStructures',
        Item: {
            feeStructureId: `fee_${Date.now()}`,
            schoolId: feeData.schoolId,
            classId: feeData.classId,
            academicYear: feeData.academicYear,
            feeTypes: feeData.feeTypes,
            totalAmount: feeData.totalAmount,
            dueDate: feeData.dueDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };
    
    await dynamodb.put(params).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        body: JSON.stringify({
            message: 'Fee structure created successfully',
            feeStructureId: params.Item.feeStructureId
        })
    };
}

async function recordPayment(paymentData) {
    const params = {
        TableName: 'SmartCampus-FeePayments',
        Item: {
            paymentId: `payment_${Date.now()}`,
            feeDueId: paymentData.feeDueId,
            studentId: paymentData.studentId,
            amount: paymentData.amount,
            paymentMethod: paymentData.paymentMethod,
            paymentDate: new Date().toISOString(),
            recordedBy: paymentData.recordedBy,
            schoolId: paymentData.schoolId
        }
    };
    
    await dynamodb.put(params).promise();
    
    // Update fee due status
    const updateParams = {
        TableName: 'SmartCampus-FeeDues',
        Key: {
            feeDueId: paymentData.feeDueId
        },
        UpdateExpression: 'SET status = :status, paidAmount = paidAmount + :amount, updatedAt = :timestamp',
        ExpressionAttributeValues: {
            ':status': 'paid',
            ':amount': paymentData.amount,
            ':timestamp': new Date().toISOString()
        }
    };
    
    await dynamodb.update(updateParams).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        body: JSON.stringify({
            message: 'Payment recorded successfully',
            paymentId: params.Item.paymentId
        })
    };
}

async function generateFeeDues(feeData) {
    // Get all students for the class
    const studentsParams = {
        TableName: 'SmartCampus-Users',
        IndexName: 'RoleIndex',
        KeyConditionExpression: 'role = :role AND schoolId = :schoolId',
        FilterExpression: 'classId = :classId',
        ExpressionAttributeValues: {
            ':role': 'student',
            ':schoolId': feeData.schoolId,
            ':classId': feeData.classId
        }
    };
    
    const students = await dynamodb.query(studentsParams).promise();
    
    // Create fee dues for each student
    const batchWriteParams = {
        RequestItems: {
            'SmartCampus-FeeDues': students.Items.map(student => ({
                PutRequest: {
                    Item: {
                        feeDueId: `due_${student.userId}_${feeData.feeStructureId}`,
                        studentId: student.userId,
                        feeStructureId: feeData.feeStructureId,
                        amount: feeData.totalAmount,
                        dueDate: feeData.dueDate,
                        status: 'pending',
                        paidAmount: 0,
                        createdAt: new Date().toISOString()
                    }
                }
            }))
        }
    };
    
    await dynamodb.batchWrite(batchWriteParams).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        body: JSON.stringify({
            message: `Generated fee dues for ${students.Items.length} students`
        })
    };
}

async function sendFeeReminders(feeData) {
    // Get students with pending fees
    const params = {
        TableName: 'SmartCampus-FeeDues',
        FilterExpression: 'status = :status AND dueDate < :today',
        ExpressionAttributeValues: {
            ':status': 'pending',
            ':today': new Date().toISOString()
        }
    };
    
    const pendingFees = await dynamodb.scan(params).promise();
    
    // Send reminders to parents
    for (const feeDue of pendingFees.Items) {
        const parentParams = {
            TableName: 'SmartCampus-Users',
            IndexName: 'RoleIndex',
            KeyConditionExpression: 'role = :role',
            FilterExpression: 'contains(children, :studentId)',
            ExpressionAttributeValues: {
                ':role': 'parent',
                ':studentId': feeDue.studentId
            }
        };
        
        const parents = await dynamodb.query(parentParams).promise();
        
        for (const parent of parents.Items) {
            const message = {
                Message: JSON.stringify({
                    default: `Fee payment overdue for ${feeDue.amount}. Due date: ${feeDue.dueDate}`,
                    APNS: JSON.stringify({
                        aps: {
                            alert: {
                                title: 'Fee Payment Overdue',
                                body: `Fee payment overdue for ₹${feeDue.amount}. Due date: ${feeDue.dueDate}`
                            },
                            badge: 1
                        }
                    })
                }),
                TopicArn: `arn:aws:sns:us-east-1:123456789012:smart-campus-parent-${parent.userId}`
            };
            
            await sns.publish(message).promise();
        }
    }
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        body: JSON.stringify({
            message: `Sent reminders for ${pendingFees.Items.length} overdue fees`
        })
    };
}
