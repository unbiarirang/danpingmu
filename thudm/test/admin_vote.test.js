const request = require('supertest');
const session = require('supertest-session');
const fs = require('fs-extra');
const app = require('../app_test');
const models = require('../models/models'); 
const consts = require('../common/consts');

let admin_session = null;
let vote_id;
const activity_id = '5c03ba2fec64483fe182a7d2';
const wrong_vote_id = 'aaa4f7be1cab9d6c156f401c';
const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'
const admin_id = 'bbb';
const admin_pw = '12345678';
const title = 'test vote';
const sub_title = 'sub_title';
const changed_sub_title = 'changed_sub_title';

describe('POST /auth/login/', () => {
    let test_session = session(app);

    test('It should login success', (done) => {
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: admin_id, input_pw: admin_pw })
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

describe('POST /vote', () => {
    beforeAll(done => {
        fs.copy('public/images/list.png', 'public/images/temp/list1.png')
            .then(() => {
                return fs.copy('public/images/list.png', 'public/images/temp/list2.png');
            })
            .then(() => {
                return fs.copy('public/images/list.png', 'public/images/temp/list3.png');
            })
            .then(() => { done(); });
    });

    test('It should create new Vote', (done) => {
        return admin_session
            .post('/vote')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: sub_title,
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "/images/temp/list1.png", "/images/temp/list2.png", "/images/temp/list3.png" ]
            })
            .then(res => {
                setTimeout(() => {
                    let result = JSON.parse(res.text);
                    let keys = Object.keys(result);
                    expect(keys).toContain('title');
                    expect(keys).toContain('sub_title');
                    expect(keys).toContain('option_num');
                    expect(keys).toContain('options');
                    expect(keys).toContain('pic_urls');
                    expect(result.title).toBe(title);
                    expect(result.sub_title).toBe(sub_title);
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
                title: title,
                sub_title: "sub title",
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ]
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
                title: title,
                sub_title: "sub title",
                option_num: 0,
                options: [],
                pic_urls: []
            })
            .then(res => {
                expect(res.statusCode).toBe(500);
                done();
            });
    });
});

describe('PUT /vote', () => {
    beforeAll(done => {
        fs.copy('public/images/list.png', 'public/images/temp/list4.png')
            .then(() => {
                return fs.copy('public/images/list.png', 'public/images/temp/list5.png');
            })
            .then(() => { done(); });
    });

    test('It should update the Vote with new images', (done) => {
        return admin_session
            .put('/vote')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: changed_sub_title,
                option_num: 2,
                options: [ "D", "E" ],
                pic_urls: [ '/images/temp/list4.png',
                            '/images/temp/list5.png' ]
            })
            .then(res => {
                setTimeout(() => {
                    let result = JSON.parse(res.text);
                    let keys = Object.keys(result);
                    expect(keys).toContain('title');
                    expect(keys).toContain('sub_title');
                    expect(keys).toContain('option_num');
                    expect(keys).toContain('options');
                    expect(keys).toContain('pic_urls');
                    expect(result.title).toBe(title);
                    expect(result.sub_title).toBe(changed_sub_title);
                    expect(result.option_num).toBe(2);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should update the Vote without new images', (done) => {
        return admin_session
            .put('/vote')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: changed_sub_title,
                option_num: 2,
                options: [ "D", "E" ],
                pic_urls: [ '/images/anonymous.jpg',
                            '/images/anonymous.jpg' ]
            })
            .then(res => {
                setTimeout(() => {
                    let result = JSON.parse(res.text);
                    let keys = Object.keys(result);
                    expect(keys).toContain('title');
                    expect(keys).toContain('sub_title');
                    expect(keys).toContain('option_num');
                    expect(keys).toContain('options');
                    expect(keys).toContain('pic_urls');
                    expect(result.title).toBe(title);
                    expect(result.sub_title).toBe(changed_sub_title);
                    expect(result.option_num).toBe(2);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It needs login to update the Vote', (done) => {
        return request(app)
            .put('/vote')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: changed_sub_title,
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ]
            })
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should fail to update Vote if there is no options', (done) => {
        return admin_session
            .put('/vote')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: changed_sub_title,
                option_num: 0
            })
            .then(res => {
                expect(res.statusCode).toBe(500);
                done();
            });
    });
});

describe('GET /vote/:vote_id and GET /vote/detail', () => {
    beforeAll(done => {
        models.Vote.findOne({ title: title })
            .then(vote => { vote_id = vote._id; done(); });
    });

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
    test('It should fail to return vote page for inactive vote activity', (done) => {
        models.Vote.updateOne({ _id: vote_id }, { status: "READY" })
            .then(() => {
                request(app)
                    .get('/vote/' + vote_id + '/user')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(204);
                            done();
                        }, 500);
                    });
            });
    });

    test('It should return vote information with the vote id for user', (done) => {
        models.Vote.updateOne({ _id: vote_id }, { status: "ONGOING" })
            .then(() => {
                request(app)
                    .get('/vote/' + vote_id + '/user')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
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

describe('POST /vote/upload/candidate', () => {
    const src_path = 'public/images/list.png'; // dummy image
    const candidate_id = 1;
    const dest_path = consts.STORE_IMG_PATH
                      + '/' + admin_id + '_candidate_'
                      + candidate_id + '.png';

    test('It should upload a vote candidate image', (done) => {
        return admin_session
            .post('/vote/upload/candidate?id=' + candidate_id)
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

    test('It needs login to upload candidate image', (done) => {
        return request(app)
            .post('/vote/upload/candidate')
            .attach('candidate_image', src_path)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});


describe('POST /vote/:vote_id/start', () => {
    test('It needs login to start a vote activity', (done) => {
        return request(app)
            .post('/vote/' + vote_id + '/start')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should start the vote activity', (done) => {
        return admin_session
            .post('/vote/' + vote_id + '/start')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should fail to start the vote activity that not exist', (done) => {
        return admin_session
            .post('/vote/' + wrong_vote_id + '/start')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

describe('POST /vote/:vote_id/finish', () => {
    test('It needs login to finish a vote activity', (done) => {
        return request(app)
            .post('/vote/' + vote_id + '/finish')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should finish the vote activity', (done) => {
        return admin_session
            .post('/vote/' + vote_id + '/finish')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should fail to finish the vote activity that not exist', (done) => {
        return admin_session
            .post('/vote/' + wrong_vote_id + '/finish')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

afterAll(() => {
    models.Vote.deleteMany({ title: title })
        .then(() => {});
    app.get('redis').flushdb(() => {
        console.log('flush redis');
    });
});
