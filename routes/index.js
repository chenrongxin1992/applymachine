var express = require('express');
var router = express.Router();

const apply = require('../db/db').apply//新闻
const async = require('async')
const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const xlsx = require('node-xlsx')
const fs = require('fs')
const config_email = {
	host :'smtp.qq.com',
	//service:'qq',
  	secureConnection: true, // 使用了 SSL
	auth : {
		user : '848536190@qq.com',
		pass : 'eerjruzzkiaxbfcg'
	}
}
const transporter = nodemailer.createTransport(config_email)
//邮件内容
const emaildata = {
	from : '848536190@qq.com',
	to : '',
	subject : '公共计算平台账号分配',
	html : ''
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/fangfa',function(req,res){
	console.log('get fangfa')
	res.render('fangfa');
})

router.post('/saveapply',function(req,res){
	console.log('save',req.body)
	async.waterfall([
		function(cb){
			let search = apply.findOne({})
				search.where('cardno').equals(req.body.cardno)
				search.where('platform').equals(req.body.platform)
				search.exec(function(error,doc){
					if(error){
						console.log('search error',error)
						cb(error)
					}
					if(!doc){
						console.log('no record')
						cb()
					}
					if(doc){
						console.log('already apply',doc)
						cb('already apply')
					}
				})
		},
		function(cb){
			let newapply = new apply({
				applypeo:req.body.applypeo,
				stuno:req.body.stuno,
				cardno:req.body.cardno,
				proname:req.body.proname,
				propeo:req.body.propeo,
				research:req.body.research,
				phone:req.body.phone,
				email:req.body.email,
				platform:req.body.platform,
				yongtu:req.body.yongtu,
				usetime:req.body.usetime
			})
			newapply.save(function(error,doc){
				if(error){
					console.log('save error')
					cb('save error')
				}
				console.log('save succeed')
				cb()
			})
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('save succeed')
		return res.json({'code':0})
	})
})

router.get('/applyrecord',function(req,res){
	console.log('router applyrecord')
	let page = req.query.page,
		limit = req.query.limit,
		cardno = req.query.cardno
	page ? page : 1;//当前页
	limit ? limit : 15;//每页数据
	let total = 0
	console.log('page limit',page,limit)
	async.waterfall([
		function(cb){
			//get count
			let search = apply.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('applyrecord get total err',err)
						cb(err)
					}
					console.log('applyrecord count',count)
					total = count
					cb(null)
				})
		},
		function(cb){//$or:[{year:2018},{year:/2018/}]//{$or:[{name:name},{principal:principal},{year:year},{year:{$regex:year}}]}
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
			if(cardno){
				let _filter = {
					$and:[
						{cardno:{$regex:cardno,$options:'$i'}}
					]
				}
				console.log('_filter',_filter)
				let search = apply.find(_filter)
					search.sort({'create':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('applyrecord error',error)
							cb(error)
						}
						//获取搜索参数的记录总数
						apply.count(_filter,function(err,count_search){
							if(err){
								console.log('applyrecord count_search err',err)
								cb(err)
							}
							console.log('搜索到记录数',count_search)
							total = count_search
							cb(null,docs)
						})
					})
			}else{
				console.log('不带搜索参数')
				let search = apply.find({})
					search.sort({'create':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('applyrecord error',error)
							cb(error)
						}
						cb(null,docs)
					})
			}
		}
	],function(error,result){
		if(error){
			console.log('applyrecord async waterfall error',error)
			return res.json({'code':-1,'msg':err.stack,'count':0,'data':''})
		}
		console.log('applyrecord async waterfall success')
		return res.json({'code':0,'msg':'获取数据成功','count':total,'data':result})
	})
}).get('/record',function(req,res){
	res.render('record')
})
// 13760277012
// 848536190@qq.com
router.get('/distribute',function(req,res){
	res.render('distribute')
}).post('/distributeform',function(req,res){
	async.waterfall([
		function(cb){
			let obj = {
				account:req.body.account,
				password:req.body.password,
				status:'已分配'
			}
			apply.updateOne({_id:req.body._id},obj,function(error,doc){
				if(error){
					console.log('updateOne error',error)
					cb(error)
					//return res.json({'code':-1,'msg':error})
				}
				console.log('send email')
				let search = apply.findOne({_id:req.body._id})
				    search.exec(function(err,doc){
				    	if(err){
				    		console.log('find err',err)
				    		cb(err)
				    	}
				    	cb(null,doc)
				    })
			})
		},
		function(doc,cb){
			let sendTo = doc.email
				console.log('check email: ',sendTo)
				emaildata.to = sendTo
				emaildata.html = '您好，你申请的 <strong>'+doc.platform+' </strong>分配的账号是: <strong style="color:red">' + doc.account + ' ' + '</strong>，密码是：<strong style="color:red">' + doc.password +'。'
				console.log('check send data: ',emaildata)
				transporter.sendMail(emaildata,function(err,info){
					if(err){
					    console.log('----- send email err -----')
						console.log(err.message)
						cb(err)
				    }else{
						console.log('message sent: ',info.response)
							cb(null)
					}
				})
		}
	],function(error,result){
		if(error){
			console.log('updateOne error',error)
			return res.json({'code':-1,'msg':error})
		}
		return res.json({'code':0,'msg':'success'})
	})
}).get('/distributeform',function(req,res){
	res.render('distributeform',{data:req.query._id})
})

router.get('/downexcel',function(req,res){
	let search = apply.find({})
		search.sort({'create':-1})
		search.exec(function(err,docs){
			if(err){
				console.log('search err-->',err.stack)
				return err
			}
			if(docs){
				//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
				//可能内存超出了
				let vac = new Array(),
					tmparr = ['序号','申请人','校园卡号','所属研究所','手机','邮箱','申请平台','预计使用时间','用途','项目名',
					'项目负责人','账号','密码','状态','申请时间']
				vac.push(tmparr)
				delete tmparr
	            for (let i = 0; i < docs.length; i++) {
	                let temp = new Array();
	                temp[0] = i + 1
	                temp[1] = docs[i].applypeo ? docs[i].applypeo:null
	                temp[2] = docs[i].cardno ? docs[i].cardno:null
	                temp[3] = docs[i].research ? docs[i].research:null
	                temp[4] = docs[i].phone ? docs[i].phone:null
	                temp[5] = docs[i].email ? docs[i].email:null
	                temp[6] = docs[i].platform ? docs[i].platform:null
	                temp[7] = docs[i].usetime ? docs[i].usetime:null
	                temp[8] = docs[i].yongtu ? docs[i].yongtu:null
	                temp[9] = docs[i].proname ? docs[i].proname:null
	                temp[10] = docs[i].propeo ? docs[i].propeo:null
	                temp[11] = docs[i].account ? docs[i].account:null
	                temp[12] = docs[i].password ? docs[i].password:null
	                temp[13] = docs[i].status ? docs[i].status:null
	                temp[14] = docs[i].create ? docs[i].create:null
	                vac.push(temp);
	                delete temp
	            };
				//console.log('check vac -- >',vac)
				//处理excel
			let options = {'!cols': [{wch:5},{wch:10},{wch:10},{wch:30},{wch:15},{wch:20},{wch:15},{wch:10},{wch:15},{wch:20},{wch:10},{wch:10},{wch:10},{wch:5},{wch:20}]};
			let buffer = xlsx.build([
					{
						name:'公共计算平台账号分配记录',
						data:vac
					}
				],options)
			let downloadexcel = __dirname + '/公共计算平台账号分配记录.xlsx'
			fs.writeFileSync(__dirname+'/公共计算平台账号分配记录.xlsx',buffer,{'flag':'w'})
			res.download(downloadexcel)
			}
			if(!docs){
				return res.json({'code':-1,'msg':'结果为空'})
			}
		})
})

module.exports = router;
