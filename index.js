const request = require('superagent');
const host = 'https://s.m.taobao.com/search';
const fsx = require('fs-extra');
const async = require('async'); 
const template = require('art-template');

var itemMap = [],
    errorList = [];


template.defaults.imports.picPathFormat =  function (path) {
    return path.replace('60x60','210x210');
}

function query(page,cb){
    request
        .get(host)
        .query({
            q: '连衣裙',
            sst: 1,
            n: 20,
            buying:'buyitnow',
            m: 'api4h5',
            abtest: 2,
            wlsort: 2,
            page: page
        })
        .end((err,res)=>{
            
            var content ;
            if(res.status == 200){
                content = JSON.parse(res.text);
            }else{
                errorList.push(page);
            }
            itemMap[page] = content.listItem;
            cb(page);


        })
}
function getTask(totalpage){
    var taskList = [];

    function getList (i){
        return (callback)=>{
                        query(i,function(data){
                            callback(null,data);
                        })
                    }
    }

    //获取template
    function getTemp(packageObj) {
        html = template(__dirname + '/src/index.art', packageObj);
        creatFile(html);
    }

    //生成页面
    function creatFile(html) {
        var file = './index.html'
        fsx.outputFile(file, html, function(err) {
            if(err)
                console.error(err);
        })
    }
    function startTask(taskList){
        errorList = [];
        async.parallelLimit(taskList, 5 ,(err,result)=>{
            // const file = './result.text'; 

            if(errorList.length == 0){
                var  temp = {};
                temp.data = itemMap;
                getTemp(temp);
            }else{
                taskList = [];
                errorList.forEach((val,i)=>{
                    taskList[i] = getList(val);
                })
                startTask(taskList);
            }

            // fsx.outputFile(file, JSON.stringify(temp), function(err) {
            //     if(err)
            //         console.error(err);
            // })
        })
    }

    for(var i = 0;i < totalpage; i++){
        taskList[i] = getList(i);
    }
    startTask(taskList);


}


getTask(10);


