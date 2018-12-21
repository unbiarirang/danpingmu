const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');
const errors = require('../common/errors');
const consts = require('../common/consts');
const fs = require('fs-extra');

let admin_session = null;
const activity_id = '5c03ba2fec64483fe182a7d2';
const wrong_activity_id = 'aaa3ba2fec64483fe182a7d2';
const admin_id = 'bbb';
const title = 'test activity';
const sub_title = 'sub title';
const changed_sub_title = 'changed sub title';

describe('POST /auth/login/', () => {
    let test_session = session(app);
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
                    admin_session = test_session;
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/:wrong_activity_id and GET /activity/detail', () => {
    test('It should redirect to /activity/detail', (done) => {
        return admin_session
            .get('/activity/' + wrong_activity_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It should fail to return activity information with the activity id', (done) => {
        return admin_session
            .get('/activity/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/:activity_id and GET /activity/detail', () => {
    test('It needs login to get activity detail', (done) => {
        return request(app)
            .get('/activity/' + activity_id)
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should redirect to /activity/detail', (done) => {
        return admin_session
            .get('/activity/' + activity_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It needs login to get activity information with the activity id', (done) => {
        return request(app)
            .get('/activity/detail')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should get activity information with the activity id', (done) => {
        return admin_session
            .get('/activity/detail')
            .then(res => {
                setTimeout(() => {
                    //expect(res.text).toMatch('admin_id');
                    //expect(res.text).toMatch('title');
                    //expect(res.text).toMatch('status');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/list', () => {
    test('It needs login to show list of activities the admin has', (done) => {
        return request(app)
            .get('/activity/list')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should return activity list that the admin has', (done) => {
        return admin_session
            .get('/activity/list')
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

describe('GET /activity/create', () => {
    test('It should return create activity page', (done) => {
        return admin_session
            .get('/activity/create')
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

describe('POST /activity and PUT /activity', () => {
    test('It should create new Activity', (done) => {
        return admin_session
            .post('/activity')
            .send({
                title: title,
                sub_title: sub_title,
                bullet_color_num: 3,
                bullet_colors: [ 'red', 'yellow', 'white' ],
                bg_img_url: 'some.url',
            })
            .then(res => {
                setTimeout(() => {
                    let result = JSON.parse(res.text);
                    let keys = Object.keys(result);
                    expect(keys).toContain('title');
                    expect(keys).toContain('sub_title');
                    expect(keys).toContain('bullet_color_num');
                    expect(keys).toContain('bullet_colors');
                    expect(keys).toContain('blacklist_user');
                    expect(keys).toContain('blacklist_word');
                    expect(keys).toContain('status');
                    expect(keys).toContain('bg_img_url');
                    expect(result.title).toBe(title);
                    expect(result.sub_title).toBe(sub_title);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('All required fields should be filled', (done) => {
        return admin_session
            .post('/activity')
            .send({
                title: title,
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('It needs login to create new Activity', (done) => {
        return request(app)
            .post('/activity')
            .send({
                title: title,
                sub_title: sub_title,
                bullet_color_num: 3,
                bullet_colors: [ 'red', 'yellow', 'white' ],
                bg_img_url: 'some.url',
            })
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should update the Activity', (done) => {
        return admin_session
            .put('/activity')
            .send({
                title: title,
                sub_title: changed_sub_title,
                bullet_color_num: 3,
                bullet_colors: [ 'red', 'yellow', 'white' ],
                bg_img_url: 'some.url',
            })
            .then(res => {
                setTimeout(() => {
                    let result = JSON.parse(res.text);
                    let keys = Object.keys(result);
                    expect(keys).toContain('title');
                    expect(keys).toContain('sub_title');
                    expect(keys).toContain('bullet_color_num');
                    expect(keys).toContain('bullet_colors');
                    expect(keys).toContain('blacklist_user');
                    expect(keys).toContain('blacklist_word');
                    expect(keys).toContain('status');
                    expect(result.title).toBe(title);
                    expect(result.sub_title).toBe(changed_sub_title);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('All required fields should be filled', (done) => {
        return admin_session
            .put('/activity')
            .send({
                title: title,
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('It needs login to update the Activity', (done) => {
        return request(app)
            .put('/activity')
            .send({
                title: title,
                sub_title: sub_title,
                bullet_color_num: 3,
                bullet_colors: [ 'red', 'yellow', 'white' ],
                bg_img_url: 'some.url',
            })
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });
});

describe('POST /activity/upload/list', () => {
    const src_path = 'public/images/list.png'; // dummy image
    const dest_path = consts.STORE_IMG_PATH
                      + '/' + admin_id + '_list.png';

    test('It should upload a list image', (done) => {
        return admin_session
            .post('/activity/upload/list')
            .attach('list_image', src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    expect(res.text).toBe(dest_path);
                    done();
                }, 500);
            });
    });

    test('Attach field should be list_image', (done) => {
        const wrong_field = 'listimage';
        return admin_session
            .post('/activity/upload/list')
            .attach(wrong_field, src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('It needs login to upload background image', (done) => {
        return request(app)
            .post('/activity/upload/list')
            .attach('list_image', src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});

describe('POST /activity/upload/bg', () => {
    const src_path = 'public/images/list.png'; // dummy image
    const dest_path = consts.STORE_IMG_PATH
                      + '/' + admin_id + '_bg.png';

    test('It should upload a background image', (done) => {
        return admin_session
            .post('/activity/upload/bg')
            .attach('bg_image', src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    expect(res.text).toBe(dest_path);
                    done();
                }, 500);
            });
    });

    test('Attach field should be bg_image', (done) => {
        const wrong_field = 'bgimage';
        return admin_session
            .post('/activity/upload/bg')
            .attach(wrong_field, src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('It needs login to upload background image', (done) => {
        return request(app)
            .post('/activity/upload/bg')
            .attach('bg_image', src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});

describe('POST /activity/finish', () => {
    test('It needs login to finish and destroy the Activity', (done) => {
        return request(app)
            .post('/activity/finish')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should finish and destroy the Activity', (done) => {
        return admin_session
            .post('/activity/finish')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    afterAll(() => {
        models.Activity.deleteOne({ title: title })
            .then(() => {});
    });
});
