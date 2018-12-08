const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');
const fs = require('fs-extra');

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

describe('GET /activity/:activity_id', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';

    test('It should get activity information with the activity id', (done) => {
        return auth_session
            .get('/activity/' + activity_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('admin_id');
                    expect(res.text).toMatch('title');
                    expect(res.text).toMatch('end_time');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('POST /activity', () => {
    const test_title = 'test activity';

    test('It should create new Activity', (done) => {
        return auth_session
            .post('/activity')
            .type('form')
            .send({
                title: test_title,
                sub_title: 'sub title',
                bullet_color_num: 3,
                bullet_colors: [ 'red', 'yellow', 'white' ],
                banned_words_url: 'some.url',
                bg_img_url: 'some.url',
                end_time: 12345678,
                list_media_id: 'test media id'
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toBe('{"result":1}');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should destroy the Activity', (done) => {
        let room_info = app.get('cache').room_info;
        const dir_name = 'public/images/activity/';
        const dir_list = fs.readdirSync(dir_name);
        const act_id = dir_list[dir_list.length - 1];
        let room = room_info.get(act_id);

        room.destroy(app.get('redis'))
            .then(() => { done(); });
    });

    afterAll(() => {
        models.Activity.deleteOne({ title: test_title })
            .then(() => {});
    });
});
