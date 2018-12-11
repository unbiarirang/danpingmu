const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');

let test_session = null;
let auth_session = null;

beforeAll (() => {
    test_session = session(app);
});

describe('GET /auth/login/', () => {
    test('It should return login page', (done) => {
        return test_session
            .get('/auth/login/')
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

describe('POST /auth/login/', () => {
    test('It should succeed login', (done) => {
        const input_id = 'bbb';
        const input_pw = '12345678';
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: input_pw })
            .then(res => {
                expect(res.statusCode).toBe(302);
                auth_session = test_session;
                done();
            });
    });
});

describe('GET /auth/signup/', () => {
    test('It should return signup page', (done) => {
        return test_session
            .get('/auth/signup/')
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

describe('POST /auth/signup/', () => {
    const input_id = 'testadminid';
    const input_pw = 'testadminpw';
    const input_email = 'test@email.com';

    beforeAll(() => {
        models.User.deleteOne({ id: input_id })
            .then(res => { console.log(res); });
    });

    test('It should succeed and fail to signup', (done) => {
        return test_session
            .post('/auth/signup/')
            .type('form')
            .send({
                input_id: input_id,
                input_pw: input_pw,
                input_email: input_email
            })
            .then(res => {
                expect(res.statusCode).toBe(302);
            })
            .then(() => {
                setTimeout(() => {
                    return test_session
                        .post('/auth/signup/')
                        .type('form')
                        .send({
                            input_id: input_id,
                            input_pw: input_pw,
                            input_email: input_email
                        })
                        .then(res => {
                            expect(res.statusCode).toBe(403);
                            done();
                        });
                }, 500);
            });
    });
});
