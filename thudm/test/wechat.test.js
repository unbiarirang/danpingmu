const request = require('supertest');
const app = require('../app_test');

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

describe('Test text type message from wechat server', () => {
    test('It should save content to rsmq', () => {
        console.log = jest.fn(storeLog);
        return request(app)
            .post('/wechat?signature=123&timestamp=123&nonce=123&openid=oAxyC0QzOLOg7_L52c3O7bEmi5gs')
            .type('xml')
            .send('<xml>' +
                '<ToUserName>testuser123</ToUserName>' +
                '<FromUserName>testuse456</FromUserName>' +
                '<CreateTime>1348831860</CreateTime>' +
                '<MsgType>text</MsgType>' +
                '<Content>testcontent123</Content>' +
                '<MsgId>1234567890123456</MsgId>' +
                '</xml>')
            .then(res => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        expect(log_output).toMatch('RSMQ data sent');
                        expect(res.statusCode).toBe(200);
                        resolve();
                    }, 1000);
                });
            });
    });
});

