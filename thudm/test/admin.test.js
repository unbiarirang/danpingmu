const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');

let test_session = null;
let auth_session = null;

beforeEach(() => {
    test_session = session(app);
});

describe('POST /auth/login/', () => {
    test('It should login success', (done) => {
        const input_id = 'bbb';
        const input_pw = '12345678';
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: input_pw })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    auth_session = test_session;
                    done();
                }, 500);
            });
    });
});

describe('GET /msglist/:room_id', () => {
    test('It should return msglist page', (done) => {
        const room_id = "5c03ba2fec64483fe182a7d2";
        return auth_session
            .get('/msglist/' + room_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });
});

describe('GET /msglist/:room_id/page/:page_id', () => {
    test('It should return msglist page', (done) => {
        const room_id = "5c03ba2fec64483fe182a7d2";
        const page_id = 1;
        return auth_session
            .get('/msglist/' + room_id + '/page/' + page_id)
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

// FIXME: for test. create queue in create activity
describe('GET /screen/:room_id', () => {
    test('It should return screen page', () => {
        const room_id = "5c03ba2fec64483fe182a7d2";
        return auth_session
            .get('/screen/' + room_id)
            .then(res => {
                expect(res.statusCode).toBe(200);
            });
    });
});

describe('GET /qrcode/:room_id', () => {
    test('It should return qrcode', () => {
        const room_id = "5c03ba2fec64483fe182a7d2";
        return auth_session
            .get('/qrcode/' + room_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
            });
    });
});

describe('GET /ticket/:room_id', () => {
    test('It should return ticket', () => {
        const room_id = "5c03ba2fec64483fe182a7d2";
        return auth_session
            .get('/ticket/' + room_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
            });
    });
});

describe('GET /', () => {
    test('It should return main admin page', () => {
        return request(app)
            .get('/')
            .then(res => {
                expect(res.statusCode).toBe(200);
            });
    });
});
