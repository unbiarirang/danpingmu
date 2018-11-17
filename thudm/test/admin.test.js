const request = require('supertest');
const app = require('../app_test');

// FIXME: for test. create queue in create activity
describe('Test GET /screen/:room_id', () => {
    test('It should save content to rsmq', () => {
        let room_id = 1;
        return request(app)
            .get('/screen/' + room_id)
            .then(res => {
                expect(res.statusCode).toBe(200);
            });
    });
});
