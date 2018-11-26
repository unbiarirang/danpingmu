/* Define constant values */
module.exports = Object.freeze({
    MAX_FROMUSER_IMAGE_NUM      : 30,
    MSG_PER_PAGE_NUM            : 15,
    QRCODE_EXPIRE_SEC           : 3*60*60,          // 3 hours
    SESSION_EXPIRE_MSEC         : 3*24*60*60*1000,  // 3 days
    WECHAT_MENU                 : {
        "button": [
            {
                "name": "互动",
                "sub_button": [
                    {
                        "type": "click",
                        "name": "投票",
                        "key": "KEY_VOTE"
                    },
                    {
                        "type": "click",
                        "name": "抢红包",
                        "key": "KEY_RED_PACKET"
                    }
                ]
            },
            {
                "type": "click",
                "name": "节目单",
                "key": "KEY_LIST"
            },
            {
                "type": "click",
                "name": "帮助",
                "key": "KEY_HELP"
            }
        ]
   }
});