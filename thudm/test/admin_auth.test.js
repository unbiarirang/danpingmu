const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');

let test_session = session(app);
let auth_session = null;

const input_id = 'bbb';
const input_pw = '12345678';
const wrong_input_id = 'wrongid';
const wrong_input_pw = 'wrongpw';

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
    test('It should fail to login with wrong admin id', (done) => {
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: wrong_input_id, input_pw: input_pw })
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should fail to login with wrong password', (done) => {
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: wrong_input_pw })
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should succeed login', (done) => {
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
    const new_input_id = 'testadminid';
    const new_input_pw = 'testadminpw';
    const new_input_email = 'test@email.com';

    beforeAll(() => {
        models.User.deleteOne({ id: new_input_id })
            .then(res => { console.log(res); });
    });

    test('It should succeed and fail to signup at the second time', (done) => {
        return test_session
            .post('/auth/signup/')
            .type('form')
            .send({
                input_id: new_input_id,
                input_pw: new_input_pw,
                input_email: new_input_email
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    done();
                }, 500);
            })
    });

    test('It should succeed and fail to signup at the second time', (done) => {
        return test_session
            .post('/auth/signup/')
            .type('form')
            .send({
                input_id: new_input_id,
                input_pw: new_input_pw,
                input_email: new_input_email
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(403);
                    done();
                }, 500);
            });
    });
});
