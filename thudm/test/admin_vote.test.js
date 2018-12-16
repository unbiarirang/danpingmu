const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models'); 

let admin_session = null;
const activity_id = '5c03ba2fec64483fe182a7d2';
const vote_id = '5c04f7be1cab9d6c156f401c';

describe.only('POST /auth/login/', () => {
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
                    admin_session
                        .get('/activity/' + activity_id)
                        .then(() => {
                            done();
                        });
                }, 500);
            });
    });
});

describe('GET /vote/:wrong_activity_id and GET /vote/detail', () => {
    const wrong_vote_id = 'aaa4f7be1cab9d6c156f401c';

    test('It should redirect to /vote/detail', (done) => {
        return admin_session
            .get('/vote/' + wrong_vote_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It should fail to return vote information with wrong vote id', (done) => {
        return admin_session
            .get('/vote/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

describe.only('GET /vote/:vote_id and GET /vote/detail', () => {
    test('It needs login to redirect to /vote/detail', (done) => {
        return request(app)
            .get('/vote/' + vote_id)
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should redirect to /vote/detail', (done) => {
        return admin_session
            .get('/vote/' + vote_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It needs login to return vote information with the vote id', (done) => {
        return request(app)
            .get('/vote/detail')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should return vote information with the vote id', (done) => {
        return admin_session
            .get('/vote/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('activity_id');
                    expect(res.text).toMatch('title');
                    expect(res.text).toMatch('option_num');
                    expect(res.text).toMatch('options');
                    expect(res.text).toMatch('status');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /vote/detail', () => {
    test('It should return vote information with the vote id', (done) => {
        return admin_session
            .get('/vote/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('activity_id');
                    expect(res.text).toMatch('title');
                    expect(res.text).toMatch('option_num');
                    expect(res.text).toMatch('options');
                    expect(res.text).toMatch('status');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /vote/list', () => {
    test('It needs login to return vote list that the activity has', (done) => {
        return request(app)
            .get('/vote/list')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should return vote list that the activity has', (done) => {
        return admin_session
            .get('/vote/list')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /vote/create', () => {
    test('It should return create vote page', (done) => {
        return admin_session
            .get('/vote/create')
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

describe('GET /vote/:vote_id/result and GET /vote/result', () => {
    const vote_id = '5c04f7be1cab9d6c156f401c';
    const wrong_vote_id = 'aaa4f7be1cab9d6c156f401c';

    test('It needs login to redirect to /vote/result', (done) => {
        return request(app)
            .get('/vote/' + vote_id + '/result')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should redirect to /vote/result', (done) => {
        return admin_session
            .get('/vote/' + wrong_vote_id + '/result')
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It should fail to return vote result with wrong vote id', (done) => {
        return admin_session
            .get('/vote/result')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });

    test('It should redirect to /vote/result', (done) => {
        return admin_session
            .get('/vote/' + vote_id + '/result')
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It needs login to return vote result with the vote id', (done) => {
        return request(app)
            .get('/vote/result')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should return vote result with the vote id', (done) => {
        return admin_session
            .get('/vote/result')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('result');
                    expect(res.text).toMatch('options');
                    expect(res.text).toMatch('pic_url');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /vote/:vote_id/user', () => {
    const vote_id = '5c04f7be1cab9d6c156f401c';
    const wrong_vote_id = 'aaa4f7be1cab9d6c156f401c';

    test('It should return vote information with the vote id for user', (done) => {
            request(app)
            .get('/vote/' + vote_id + '/user')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should fail to return vote information with wrong vote id for user', (done) => {
            request(app)
            .get('/vote/' + wrong_vote_id + '/user')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

describe('POST /vote/:vote_id/votefor/:option_id', () => {
    const vote_id = '5c04f7be1cab9d6c156f401c';
    const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'
    const option_id = 1;

    test('It should vote successfully', (done) => {
        request(app)
            .post('/vote/' + vote_id + '/votefor/' + option_id
                 + '?open_id=' + open_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should fail to vote', (done) => {
        request(app)
            .post('/vote/' + vote_id + '/votefor/' + option_id
                 + '?open_id=' + open_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(403);
                    done();
                }, 500);
            });
    });

    afterAll(() => {
        app.get('redis').delAsync('voteuser_' + vote_id).then(()=>{});
        app.get('redis').delAsync('vote_' + vote_id).then(()=>{});
    });
});

describe.only('POST /vote/upload/candidate', () => {
    const src_path = 'public/images/list.png'; // dummy image
    const candidate_no = 1;
    const dest_path = '/images/activity/' + activity_id + '/' + vote_id
                    + '_candidate' + candidate_no + '.png';

    test('It should upload a vote candidate image', (done) => {
        return admin_session
            .post('/vote/upload/candidate?no=' + candidate_no)
            .attach('candidate_image', src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    expect(res.text).toBe(dest_path);
                    done();
                }, 500);
            });
    });

    test('Attach field should be candidate_image', (done) => {
        const wrong_field = 'candidateimage';
        return admin_session
            .post('/vote/upload/candidate')
            .attach(wrong_field, src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('It should have activity_id in the session', (done) => {
        return request(app)
            .post('/vote/upload/candidate')
            .attach('candidate_image', src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });
});

describe('POST /vote and PUT /vote', () => {
    const test_title = 'test vote';

    test('It should create new Vote', (done) => {
        const sub_title = 'sub_title';
        return admin_session
            .post('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: sub_title,
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ],
                status: "ONGOING"
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

    test('It needs login to create new Vote', (done) => {
        return request(app)
            .post('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: "sub title",
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ],
                status: "ONGOING"
            })
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should fail to create new Vote if there is no options', (done) => {
        return admin_session
            .post('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: "sub title",
                option_num: 0,
                options: [],
                pic_urls: [],
                status: "ONGOING"
            })
            .then(res => {
                expect(res.statusCode).toBe(500);
                done();
            });
    });

    test('It should update the Vote', (done) => {
        const changed_sub_title = 'changed_sub_title';
        return admin_session
            .put('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: changed_sub_title,
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ],
                status: "ONGOING"
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch(changed_sub_title);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It needs login to update the Vote', (done) => {
        const changed_sub_title = 'changed_sub_title';
        return request(app)
            .put('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: changed_sub_title,
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ],
                status: "ONGOING"
            })
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('The type of the fields should be correct', (done) => {
        const wrong_type_sub_title = { sub_title: "wrong" };
        return admin_session
            .put('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: wrong_type_sub_title,
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ],
                status: "ONGOING"
            })
            .then(res => {
                expect(res.statusCode).toBe(500);
                done();
            });
    });

    afterAll(() => {
        models.Vote.deleteOne({ title: test_title })
            .then(() => {});
    });
});
