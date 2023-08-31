// express_demo.js 文件
const fs = require('fs')
const path = require('path')
const ip = require('ip')
const bodyParser = require('body-parser')
const jsdom = require('jsdom');
const { JSDOM } = jsdom;


// 引入 express 并且创建一个 express 实例赋值给 app
const express = require('express')

// cors 模块用来解决跨域问题
const cors = require('cors')

const log = console.log.bind(console)

const myIp = ip.address()
console.log('my ip----', myIp)


const app = express()


// 配置静态文件目录
app.use(express.static('public'))
app.use(cors())

// app.all('*',function (req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', '*');
//     res.header('Content-Type', 'application/json;charset=utf-8');
//     res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
//     next();
// });

// 自己解析前端发送过来的 json 格式的数据
app.use(bodyParser.json())

// 漫画路径(默认)
var comic_dir = './comic'
if(process.argv[2]) {
    log('文件夹参数----', process.argv[2])
    comic_dir = process.argv[2]
} else {
    console.error('运行时请传comic文件夹，示例：npm start -- ./comic_dir')
    process.exit()
}
const enrichHTML= () => {
    var path = './public/index.html'
    fs.readFile(path,  { encoding: 'utf-8'}, (error, data) => {
        // log(`读取 ${path} 内容是`, typeof data, data.length)
        // 用 response.send 函数返回数据给浏览器
        const HTMLdom = new JSDOM(data)
        const aim_meta = HTMLdom.window.document.querySelector("#ipmeta")
        // console.log('meta********',  typeof aim_meta, aim_meta.getAttribute("value"))
        if(aim_meta) {
            // 有ip meta
            aim_meta.setAttribute("value", myIp)
            // console.log('dom.serialize-----', HTMLdom.serialize())
            fs.unlinkSync(path)
            fs.writeFileSync(path, HTMLdom.serialize())
        } else {
            var dataArr = data.split("<head>")
            var m = "<meta name='ip-name' value='" + myIp + "' id='ipmeta' \/>"
            var HTML = dataArr[0] + "<head>" + m + dataArr[1]

            fs.unlinkSync(path)
            fs.writeFileSync(path, HTML)
        }
    })
}

enrichHTML()

const sendHtml = (path, response) => {
    let options = {
        encoding: 'utf-8',
    }
    fs.readFile(path, options, (error, data) => {
        // log(`读取 ${path} 内容是`, typeof data, data.length)
        // 用 response.send 函数返回数据给浏览器
        var dataArr = data.split("<head>")
        var m = "<meta name='ip-name' value=" + myIp + "/>"
        var HTML = dataArr[0] + "<head>" + m + dataArr[1]
        log('sendHTML==========', HTML)
        response.send(HTML)
    })
}

const sendJSON = (data, response) => {
    let r = JSON.stringify(data, null, 2)
    response.send(r)
}

function isImageFile(filename) {
    const ext = filename.split('.')
    let trail = ext[ext.length - 1]
    return trail === 'png' || trail === 'jpg' || trail === 'jpeg' || trail == 'webp';
}

const readImg = (path, imgs) => {
    let res = []
    for(let i = 0; i < imgs.length; i++){
        let file_p = path + '/' + imgs[i]
        let type = imgs[i].split('.')[1]
        let imgData =  fs.readFileSync(file_p, {encoding: 'base64' })
        res.push({type, data: imgData})
    }
    return res
}
const comicMenu = (path, id = 0) => {
    var files = fs.readdirSync(path)
    let result = []
    for(let i = 0; i < files.length; i++){
        let item = files[i]
        let p = path + '/' + item
        
        let stat = fs.statSync(p)
        let level = id + '-' + i
        let obj = {
            path: '',
            filename: '',
            children: [],
            level,
        }
        if(stat.isDirectory()){
            obj.path = p
            obj.filename = item
            obj.children = comicMenu(p, level)
            result.push(obj)
        } else {
            // if(isImageFile(p) && i == 0) {
            //     obj.cover = p
            //     obj.comicPath = path
            //     result.push(obj)
            //     break
            // }
        }
        
    }
    return result
}

app.get('/menu', (request, response) => {
    let menu = comicMenu(comic_dir)
    if(menu.length == 0) {
        let r = {
            path: comic_dir,
            sub_dir: 0
        }
        sendJSON(r, response)
    } else {
     sendJSON(menu, response)
    }
})
app.get('/', (req, res) => {
    sendHtml('./public/index.html', res)
})

app.post('/comic', async (req, res) => {
    // ./comic/XXX
    let path = req.body.path
    let acount = req.body.acount
    let pageNo = req.body.pageNo

    var result = {
        total: '',
        comics: [],
        pageNo: pageNo,
        acount: acount
    }

    var images = fs.readdirSync(path)
    result.total = images.length

    
    let comic_names = []
    let start = (pageNo - 1) * acount
    let end = start + acount - 1 // [start, end]
    if (end > images.length) {
        end = images.length - 1
    }
    for(let i = start; i <= end; i++) {
        let img = images[i]
        comic_names.push(img)
    }

    // 读取图片数据
    const comicsWithImageData = readImg(path, comic_names)
    result.comics = comicsWithImageData

    sendJSON(result, res)
})


const main = () => {
    let server = app.listen(8000, myIp, () => {
        var host = server.address().address
        var port = server.address().port
        console.log("应用实例，访问地址为 http://%s:%s", host, port)
    })
}

if (require.main === module) {
    main()
}

// 运行服务器 npm run start -- ./comic