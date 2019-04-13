# Danpingmu - 弹屏目 👀

**Danpingmu** is a wechat program containing **live commenting** (弹幕), **voting** and **lottery** activity that drawing participation and interaction of participants as one part of student party, developed and maintenanced by THUDM team. 

## Features

#### 1. Live commenting

The admin user of an activity is allowed to set up the background image and color of comments. Participants who scan the activity's QRCODE can join the activity and start to send comments or images through wechat chat window. If the comment is approved by the manager (both manual review mode and no review mode are provided) and contains no banned words, it will be displayed on the screen.

**Additional options:**

- Manual review
- Auto filtering - blacklist and banned words

![Image text](https://github.com/unbiarirang/danpingmu/blob/master/pic/3.png)
![Image text](https://github.com/unbiarirang/danpingmu/blob/master/pic/1.png)

#### 2. Lottery

The admin user is allowed to create a lottery activity, determining the number of winners and duration of the lottery effect with ease. Audiences will automatically take part in the lottery activity if they've scanned the QRCODE.

#### 3. Voting

The administrator is able to create and publish vote activities at any time.

#### 4. Program list

A program list of the party could be uploaded and users can check it by pressing the menu button below.

<p align="center">
<img src="https://github.com/unbiarirang/danpingmu/blob/master/pic/2.jpg" width="300">
</p>

## Getting Started

- Run the server

```shell
$ cd ./danpingmu/thudm
$ npm install
$ sudo ./bin/www
```

- Deployment 

```shell
$ sudo docker build -t danpingmu .
$ sudo docker run -p 0000:80 -d danpingmu
```

