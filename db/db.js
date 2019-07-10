/**
 *  @Author:    chenrongxin
 *  @Create Date:   2019-6-1
 *  @Description:   题目类别表
 */

    const mongoose = require('mongoose')
    mongoose.Promise = global.Promise;
    //服务器上
    const DB_URL = 'mongodb://applymachine:youtrytry@localhost:27017/applymachine'
    //本地
    //const DB_URL = 'mongodb://localhost:27017/dxxxhjs'
    mongoose.connect(DB_URL,{useNewUrlParser:true})

    /**
      * 连接成功
      */
    mongoose.connection.on('connected', function () {    
        console.log('Mongoose connection open to ' + DB_URL);  
    });    

    /**
     * 连接异常
     */
    mongoose.connection.on('error',function (err) {    
        console.log('Mongoose connection error: ' + err);  
    });    
     
    /**
     * 连接断开
     */
    mongoose.connection.on('disconnected', function () {    
        console.log('Mongoose connection disconnected');  
    }); 
    const moment = require('moment')
let Schema = mongoose.Schema
//申请表
var applySchema = new Schema({
    applypeo : {type:String},
    cardno : {type:String},
    stuno : {type:String},
    proname : {type:String},//项目名
    propeo : {type:String},//项目负责人
    research:{type:String},//研究所
    phone:{type:String},
    email:{type:String},
    platform:{type:String},
    yongtu:{type:String},
    usetime:{type:String},
    status:{type:String,default:'待分配'},//状态 待分配，已分配
    account:{type:String},
    password:{type:String},
    create:{type:String,default:moment().format('YYYY:MM:DD HH:mm:ss')}
},{collection:'apply'})

exports.apply = mongoose.model('apply',applySchema)