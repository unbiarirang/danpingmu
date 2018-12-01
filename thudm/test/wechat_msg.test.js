const request = require('supertest');
const fs = require('fs');
const app = require('../app_test');
const utils = require('../common/utils');

//describe('Test the root path', () => {
//    test('It should respose the GET method', () => {
//        return request(app).get('/').then(res => {
//            console.log(res.statusCode);
//            expect(res.statusCode).toBe(200);
//        });
//    });
//});

let log_output = "";
const storeLog = input => (log_output += input);

describe('User send a text type message', () => {
    const room_id = '5c03ba2fec64483fe182a7d2';
    const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'

    test('It should save the content to rsmq', (done) => {
        console.log = jest.fn(storeLog);
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { room_id: room_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testuser</ToUserName>' +
                        '<FromUserName>testuser</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>text</MsgType>' +
                        '<Content>testcontent</Content>' +
                        '<MsgId>1234567890</MsgId>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                expect(log_output).toMatch('RSMQ data sent');
                done();
                }, 500);
            });
    });

});

describe('User send an image type message', () => {
    const room_id = '5c03ba2fec64483fe182a7d2';
    const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'
    const msg_id = '1234567890'

    beforeAll(() => {
        const dir_name = 'public/images/activity/' + room_id + '/fromuser';
        const file_list = fs.readdirSync(dir_name);
        file_list.forEach(file_name => {
            fs.unlink(dir_name + file_name, () => {});
        });
    });

    test('It should save the image in fromuser direcoty', (done) => {
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { room_id: room_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testname</ToUserName>' +
                        '<FromUserName>testname</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>image</MsgType>' +
                        '<PicUrl>http://techidiocy.com/wp-content/uploads/2014/04/id-and-ObjectIds-in-MongoDB-11.png</PicUrl>' +
                        '<MsgId>' + msg_id + '</MsgId>' +
                        '<MediaId>1234567890</MediaId>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    const dir_name = 'public/images/activity/' + room_id + '/fromuser';
                    const file_list = fs.readdirSync(dir_name);
                    expect(file_list).toContain(msg_id + '.png');
                    done();
                }, 1000);
            });
    });
});

describe('User send an invalid type message', () => {
    const room_id = '5c03ba2fec64483fe182a7d2';
    const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'

    test('It should do nothing', (done) => {
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { room_id: room_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testname</ToUserName>' +
                        '<FromUserName>testname</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>text</MsgType>' +
                        '<Content>[Unsupported Message]</Content>' +
                        '<MsgId>1234567890</MsgId>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    done();
                }, 500);
            });
    });
});