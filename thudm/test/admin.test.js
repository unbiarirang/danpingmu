const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');

// FIXME: for test. create queue in create activity
//describe('GET /screen/:room_id', () => {
//    test('It should save content to rsmq', () => {
//        const room_id = "5c03ba2fec64483fe182a7d2";
//        return request(app)
//            .get('/screen/' + room_id)
//            .then(res => {
//                expect(res.statusCode).toBe(200);
//            });
//    });
//});

