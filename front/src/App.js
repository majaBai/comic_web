import './App.css';
import axios from "axios";
import React, { useState, useEffect,useRef } from 'react';
import { Menu } from 'antd';
// import { DoubleLeftOutlined } from '@ant-design/icons';

let meta = document.getElementById('ipmeta')
let host = meta.getAttribute('value')
console.log('host-----',host)

const api = axios.create({
  baseURL: `http://${host}:8000`
})
function washMenu(data) {
  for(let i = 0; i < data.length; i++){
    let item = data[i]
    item.label = item.filename
    item.key = item.level
    if(item.children.length) {
      item.children = washMenu(item.children)
    } else {
      delete item.children
    }
  }
  return data
}



function App() {
  // host 由后端代码注入 index.html
  // let meta = document.getElementById('ipmeta')
  // let host = meta.getAttribute('value')
  // console.log('host1111-----',host)
  const [comicMenu, setMenu] = useState([]);
  const [comicImg, setImg] = useState([]);
  const [curPage, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [ischange, changeComic] = useState(false);
  const [curComicPath, setComicPath] = useState('');
  const comicPageRef = useRef(null);

  const lastPage = () => {
    if(curPage >  1) {
      setPage(curPage - 1)
      let params = {
        path: curComicPath,
        acount: 10,
        pageNo: curPage - 1
      }
      getComics(params)
    }
  }

  const nextPage = () => {
    let totalPage = Math.ceil(total / 10)
    if(curPage < totalPage) {
      setPage(curPage + 1)
      let params = {
        path: curComicPath,
        acount: 10,
        pageNo: curPage + 1
      }
      getComics(params)
    }
  }

  const getComics = (params) => {
    api.post('/comic', params).then(res => {
      console.log('post comic res', res.data)
      let data = res.data
      setImg(data.comics)
      setPage(data.pageNo)
      setTotal(data.total)
      changeComic(false)
      comicPageRef.current.scrollTop = 0;
    }).catch(err => {
      console.log('post comic err', err)
    })
  }
  const selectItem = ({item}) =>{
    changeComic(true)
    let path = item.props.path
    console.log('select item---',path, item)
    setComicPath(path)
    setImg([])
    setPage(1)
    setTotal(0)
    let p = {
      path: path,
      acount: 10,
      pageNo: 1
    }
    getComics(p)
    
  }
  
  // useEffect 如果第二个参数是一个空数组，就表明副效应参数没有任何依赖项。
  // 只会在组件加载进入 DOM 后执行一次，后面组件重新渲染，就不会再次执行, 如componentDidMount
  useEffect(() => {
    api.get("/menu").then((response) => {
      console.log('res', response.data)
      let m = washMenu(response.data)
      if(Array.isArray(m)) {
        setMenu(m)
      } else {
        let comicPath = m.path || ''
        setComicPath(comicPath)
        let params = {
          path: comicPath,
          acount: 10,
          pageNo: curPage
        }
        getComics(params)
      }
      
    }).catch((err) => {
      console.log('get menu err', err)
    })
  }, []);

  return (
    <div className="App">
     {comicMenu.length > 0 && <Menu
      mode="horizontal"
      theme='dark'
      style={{ width: " 100%", height:50, overflowY: "auto"}}
      onSelect={selectItem}
      items={comicMenu}
    />
     }
    {comicImg.length > 0 && 
    <div className="comic" ref={comicPageRef}>
      <div>
      {
        comicImg.map((imgdata, idx) => {
          return(
            <div key={idx} className='comic-content'>
              <img className='comic-img' src={"data:image/" + imgdata.type + ";base64," + imgdata.data} alt=''></img>
            </div>
          )
        })
      }
      </div>
      <div className='footer'>
        <div>共{total}张, 10/页, 第{curPage}页</div>
        <div className='last'onClick={lastPage}>上一页</div>
        <div className='next' onClick={nextPage}>下一页</div>
        { curPage * 10 >= total &&
          <div className='over-tip'>恭喜大人! 本漫画看完了~~~</div>
        }
      </div>
    </div>
    }
    {!ischange && comicMenu.length > 0 &&
    <div className='tip'>请从目录选择你的喜欢的漫画</div>
    }
    {
      comicMenu.length < 1 && comicImg.length < 1 &&
      <div className='tip'>目录 {curComicPath} 下没有漫画</div>
    }
    </div>
  );
}

export default App;
