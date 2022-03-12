

// 更新进度
let upgrade_progress = 0;

const ipcRenderer = window.require('electron').ipcRenderer;
function init() {
    // 监听 main process 里发出的 message
    ipcRenderer.on('downstate', (event, arg) => {
        alert("下载状态:" + arg);
    })
}


function loadPage(url) {
    $("#box-main").empty();
    $.get(url, function (data, status) {
        $("#box-main").html(data);
    });
}


// 下载
function down() {
    ipcRenderer.send('download');
}

// 关闭程序
function up_close() {
    console.log("close");
    ipcRenderer.send('close');
};
