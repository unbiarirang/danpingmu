const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models'); 
const utils = require('../common/utils');

let admin_session = null;

const input_id = 'bbb';
const input_pw = '12345678';
const activity_id = '5c03ba2fec64483fe182a7d2';

const login = () => {
    let test_session = session(app);
    return new Promise((resolve, reject) => {
        test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: input_pw })
            .then(res => {
                return setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    admin_session = test_session;
                    // admin session get one actiivty information
                    admin_session
                        .get('/activity/' + activity_id)
                        .then(() => {
                            resolve();
                        });
                }, 500);
            });
    });
}

describe('POST /auth/login/', () => {
    test_session = session(app);

    test('It should login success', (done) => {
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: input_pw })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    admin_session = test_session;
                    // admin session get one actiivty information
                    admin_session
                        .get('/activity/' + activity_id)
                        .then(() => {
                            done();
                        });
                }, 500);
            });
    });
});

describe('GET /lottery/:wrong_lottery_id and GET /lottery/detail', () => {
    test('It should redirect to /lottery/detail', (done) => {
        const wrong_lottery_id = 'aaa89594778fb6bc06161989';
        return admin_session
            .get('/lottery/' + wrong_lottery_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It should fail to return lottery information', (done) => {
        return admin_session
            .get('/lottery/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

describe('GET /lottery/:lottery_id and GET /lottery/detail', () => {
    test('It should redirect to /lottery/detail', (done) => {
        const lottery_id = '5c089594778fb6bc06161989';
        return admin_session
            .get('/lottery/' + lottery_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It needs login to redirect to /lottery/detail', (done) => {
        const lottery_id = '5c089594778fb6bc06161989';
        return request(app)
            .get('/lottery/' + lottery_id)
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should return lottery information with the lottery id', (done) => {
        return admin_session
            .get('/lottery/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('activity_id');
                    expect(res.text).toMatch('title');
                    expect(res.text).toMatch('winner_num');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It needs login to get lottery information with the lottery id', (done) => {
        return request(app)
            .get('/lottery/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});

describe('GET /lottery/list', () => {
    test('It should return lottery list that the activity has', (done) => {
        return admin_session
            .get('/lottery/list')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);// === 200 ||
                           //res.statusCode === 304).toBeTruthy();
                    done();
                }, 500);
            });
    });
});

describe('GET /lottery/create', () => {
    test('It should return create lottery page', (done) => {
        return admin_session
            .get('/lottery/create')
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

describe('GET /lottery/:lottery_id/draw', () => {
    const lottery_id = '5c089594778fb6bc06161989';
    const wrong_lottery_id = 'aaa89594778fb6bc06161989';

    test('No user participates in the lottery event', (done) => {
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + lottery_id + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
            });
    });

    test('One user participates in the lottery event', (done) => {
        app.get('cache').user_info.set('testopenid1', {
            open_id: 'testopenid1',
            head_img_url: 'testheadimgurl1',
            nickname: 'testnickname1'
        });
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + lottery_id + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
            });
    });

    test('More than one users participate in the lottery event', (done) => {
        app.get('cache').user_info.set('testopenid1', {
            open_id: 'testopenid1',
            head_img_url: 'testheadimgurl1',
            nickname: 'testnickname1'
        });
        app.get('cache').user_info.set('testopenid2', {
            open_id: 'testopenid2',
            head_img_url: 'testheadimgurl2',
            nickname: 'testnickname2'
        });
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + lottery_id + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
            });
    });

    test('It should fail to draw the winner', (done) => {
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + wrong_lottery_id + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(204);
                            done();
                        }, 500);
                    });
            });
    });

    test('It needs login to draw the winner', (done) => {
        request(app)
            .get('/lottery/' + lottery_id + '/draw')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});

describe('POST /lottery and PUT /lottery', () => {
    const test_title = 'test lottery';

    test('It should create new Lottery', (done) => {
        const sub_title = 'sub title';
        return admin_session
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: sub_title,
                winner_num: 1
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch(test_title);
                    expect(res.text).toMatch(sub_title);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('Winner number should be greater than 0', (done) => {
        return admin_session
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: 'testsubtitle',
                winner_num: 0
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('The type of the fields should be correct', (done) => {
        const wrong_type_sub_title = { sub_title: "wrong" };
        return admin_session
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: wrong_type_sub_title,
                winner_num: 1
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });


    test('It needs login to create new Lottery', (done) => {
        const sub_title = 'sub title';
        return request(app)
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: sub_title,
                winner_num: 1
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });

    test('It should update the Lottery', (done) => {
        const changed_sub_title = 'changed sub title';
        return admin_session
            .put('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: changed_sub_title,
                winner_num: 1
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch(changed_sub_title);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('The type of the fields should be correct', (done) => {
        const wrong_type_sub_title = { sub_title: "wrong" };
        return admin_session
            .put('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: wrong_type_sub_title,
                winner_num: 1
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('It needs login to update the Lottery', (done) => {
        const changed_sub_title = 'changed sub title';
        return request(app)
            .put('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: changed_sub_title,
                winner_num: 1
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });

    afterAll(() => {
        models.Lottery.deleteOne({ title: test_title })
            .then(() => {});
    });

});
