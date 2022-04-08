const { async } = require("node-stream-zip");
const { app } = require("electron");

const { exists } = window.require("fs");
const moment = window.require('moment');

// 引入 remote 模块
const remote = window.require("@electron/remote");
//引入 path 模块
const path = window.require('path');
//引入 文件操作 模块
const fs = window.require('fs');
//引入 unzip 模块
// var unzip = window.require('node-unzip-2');
//引入 node-stream-zip 模块
// const StreamZip = window.require('node-stream-zip');
// 解压
const compressing = window.require('compressing');
// 执行脚本
const { exec, spawn, spawnSync} = window.require('child_process');

const log = window.require('electron-log')
// 日志文件等级，默认值：false
log.transports.console.level = 'silly';
// 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
// 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
log.transports.file.maxSize = 1048576;

log.info("")
log.info("==========================")
log.info("||      hello world     ||")
log.info("==========================")

// 所有Node.js API都可以在预加载过程中使用。
// 它拥有与Chrome扩展一样的沙盒。
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})


// ////////////// //
//     升级       //
// ////////////// //
// 1、初始化升级程序
// 2、检测升级包
// 3、卸载原程序
// 4、备份原程序
// 5、解压升级包 && 覆盖原程序
// 6、安装升级程序
// 7、清理安装包
// 8、完成


// 1、初始化升级程序
window.init_controller = function() {
  const app = remote.app
  log.info("init controller ..... ")
  log.info("init controller ..... " + " ===> dirname:" + path.join(__dirname))
  log.info("init controller ..... " + " ===> download args:" + remote.process.argv)
  log.info("init controller ..... " + " ===> download path:" + app.getPath("downloads"))

  // register is 1
  if (!action_register(1, 1) || !action_register(7, 1)) {
    return
  }

  // var argv1 = remote.process.argv[app.isPackaged ? 1 : 2];
  if (remote.process.argv.length == (app.isPackaged ? 1 : 2)) {
    // 未通知升级包的绝对路径 && 默认客户端
    var zipFilePath = path.join(app.getPath("downloads"), "upgrade.zip");
    upgrade_result =  upgrade(zipFilePath, 1);
  } else if (remote.process.argv.length == (app.isPackaged ? 2 : 3)) {
    // 通知升级包的名字 && 默认客户端
    var zipFileName = remote.process.argv[app.isPackaged ? 1 : 2];
    var zipFilePath = path.join(app.getPath("downloads"), zipFileName);
    upgrade_result =  upgrade(zipFilePath, 1);
  } else if (remote.process.argv.length == (app.isPackaged ? 3 : 4)){
    // 通知升级包的名字 && 通知系统类型
    var zipFileName = remote.process.argv[app.isPackaged ? 1 : 2];
    var zipFilePath = path.join(app.getPath("downloads"), zipFileName);
    var systemType = remote.process.argv[app.isPackaged ? 2 : 3];
    upgrade_result =  upgrade(zipFilePath, systemType);
  } 
  log.info("init controller ..... " + "===> end !!")
};


/**
 * 升级失败的回滚控制
 * 1、卸载脚本
 * 2、还原备份文件
 * 3、安装脚本
 */
window.rollback_controller = function() {
  log.info("rollback controller ..... ")
  if (upgrade_flag_number >= 3 && upgrade_flag_number < 6) {
    // 1、执行卸载脚本
    if (!uninstall_original_program('uninstall.exe', 2)) {
      return false;
    }
    log.info("flag num:" + upgrade_flag_number + " ===> uninstall original program end !!")
    async() => {
      await sleep_and_await(sleep_time);
    }

    // 2、还原备份文件
    if (!rollback_source_program()) {
      return false;
    }
    log.info("flag num:" + upgrade_flag_number + " ===> rollback source program end !!")
  }

  // 3、安装脚本
  if (upgrade_flag_number >= 2) {
    if (!install_upgrade_program('install.exe', 7)) {
      return false;
    }
    log.info("flag num:" + upgrade_flag_number + " ===> install upgrade program end !!")
    async() => {
      await sleep_and_await(sleep_time);
    }
  }
  log.info("rollback controller ..... " + " ===> end !!")
  return true;
};


// 2、正式的升级逻辑
window.upgrade = function(zipFilePath, systemType) {
  // 1、检测升级包是否存在
  if (!action_register(1, 2) || !check_upgrade_package(zipFilePath, systemType)) {
    return false;
  }
  upgrade_flag_number = 1;
  // upgrade_progress = upgrade_progress + 10 > 20 ? upgrade_progress : upgrade_progress + Math.floor((Math.random()*10)+1);
  // checkout(upgrade_progress)
  log.info("flag num:" + upgrade_flag_number + " ===> check upgrade package end !!")
  async() => {
    await sleep_and_await(sleep_time);
  }
  
  // 2、卸载原程序
  if (!action_register(1, 3) || !uninstall_original_program('uninstall.exe', 2)) {
    return false;
  }
  upgrade_flag_number = 2;
  // upgrade_progress = upgrade_progress + 20 > 40 ? upgrade_progress : upgrade_progress + Math.floor((Math.random()*20)+1);
  // checkout(upgrade_progress)
  log.info("flag num:" + upgrade_flag_number + " ===> uninstall original program end !!")
  async() => {
    await sleep_and_await(sleep_time);
  }

  // 3、备份原程序
  if (!action_register(1, 4) || !backup_source_program(systemType)) {
    return false;
  }
  upgrade_flag_number = 3;
  // upgrade_progress = upgrade_progress + 20 > 60 ? upgrade_progress : upgrade_progress + Math.floor((Math.random()*20)+1);
  // checkout(upgrade_progress)
  log.info("flag num:" + upgrade_flag_number + " ===> backup source program end !!")

  // 4、解压升级包 && 覆盖原程序
  if (!action_register(1, 5) || !unzip_upgrade_package(zipFilePath, systemType)) {
    return false;
  }
  upgrade_flag_number = 4;
  // upgrade_progress = upgrade_progress + 20 > 80 ? upgrade_progress : upgrade_progress + Math.floor((Math.random()*20)+1);
  // checkout(upgrade_progress)
  log.info("flag num:" + upgrade_flag_number + " ===> unzip upgrade package end !!")

  // 5、安装升级程序
  if (!action_register(1, 6) || !install_upgrade_program('install.exe', 7)) {
    return false;
  }
  upgrade_flag_number = 5;
  // upgrade_progress = upgrade_progress + 10 > 90 ? upgrade_progress : upgrade_progress + Math.floor((Math.random()*10)+1);
  // checkout(upgrade_progress)
  log.info("flag num:" + upgrade_flag_number + " ===> install upgrade program end !!")
  async() => {
    await sleep_and_await(sleep_time);
  }

  // 6、清理升级包
  if (!action_register(1, 0) || !clear_upgrade_packege(zipFilePath)) {
    return false;
  }
  upgrade_flag_number = 6;
  // upgrade_progress = upgrade_progress + 10 > 100 ? upgrade_progress : upgrade_progress + Math.floor((Math.random()*10)-1);
  // checkout(upgrade_progress)
  log.info("flag num:" + upgrade_flag_number + " ===> clear upgrade packege end !!")
  async() => {
    await sleep_and_await(sleep_time);
  }

  upgrade_success = true;

  return true;
}


/** 检查升级包是否存在 */
window.check_upgrade_package = function(zipFilePath, systemType) {
  var exist = fs.existsSync(zipFilePath);
  if (!exist) {
    console.log("版本升级包不存在！！");
    log.error("check ....." + " ==> " + zipFilePath + " 文件不存在 !!")
  } else {
    log.info("check ....." + " ==> " + zipFilePath +  " 文件存在 !!")
  }
  return exist
};


/** 卸载原程序 or 服务 */
window.uninstall_original_program = function(batFileName, args) {
  const app = remote.app
  let batFilePath = path.join(app.getAppPath(), '../../../../', batFileName)
  var exist = fs.existsSync(batFilePath);
  if (!exist) {
    log.info("uninstall ....." + " ==> " + batFilePath + " 文件不存在！！")
    return false;
  }
  log.info("uninstall ....." + " ==> " + batFilePath +  " 文件存在 !!")
  // 执行卸载脚本
  return execute_script_file(batFilePath, args);
};

/**
 * 执行命令行
 * @param {命令} command 
 */
window.execute_script = function(command) {
  log.info("execute .....")
  log.info("execute ....." + " ===> command:" +  command);
  let bat = spawnSync('cmd.exe', ['/c', command]);

  if (bat.status != 0) {
    return false;
  }
  return true;
}

/**
 * 执行脚本文件
 * @param {脚本文件} batFilePath 
 * @param {参数} args 
 */
window.execute_script_file = function(batFilePath, args) {
  log.info("execute .....")
  let bat = spawnSync('cmd.exe', ['/c', batFilePath]);
  if(batFilePath.includes('upgrade')) {
    bat = spawnSync('cmd.exe', ['/c', batFilePath, args]);
  }
  if (bat.status != 0) {
    return false;
  }
  return true;
};

/**
 * 备份原程序
 */
window.backup_source_program = function(systemType) {
  log.info("backup .....")
  var command = "";
  var app = remote.app
  var date = moment().format('YYYY_MM_DD');
  var source_path = path.join(app.getAppPath(), '../../../..');
  if (systemType == 1) {  //客户端
    temp_path = path.join(source_path, "../", 'EDA_WIN_bak');
    // temp_path = path.join(app.getPath("temp"), 'EDA_WIN_bak');
    // temp_path = path.join(path.getPath("temp"), 'EDA_WIN'+"_" + date);
  } else {
    temp_path = path.join(source_path, '../', 'EDA_BS_WIN_bak');
    // temp_path = path.join(app.getPath("temp"), 'EDA_BS_WIN_bak');
    // temp_path = path.join(path.getPath("temp"), 'EDA_BS_WIN'+"_" + date);
  }
  var noCopyFile = path.join(source_path, 'dist', 'win-csliveud', 'uncopy.txt');
  log.info("backup ....." + " ===> " + "src:" + temp_path + ", dst:" + source_path);
  command = "xcopy " + source_path + " " + temp_path + " /E/Y/C/I /EXCLUDE:" + noCopyFile;
  return execute_script(command);
};

/**
 * 还原原程序
 */
window.rollback_source_program = function() {
  log.info("rollback .....")
  var command = "";
  var app = remote.app
  var date = moment().format('YYYY_MM_DD');
  var systemType = remote.process.argv[app.isPackaged ? 2 : 3];
 
  var dst_path = path.join(app.getAppPath(), '../../../..');
  if (systemType == 1) {  //客户端
    src_path = path.join(dst_path, "../", 'EDA_WIN_bak');
  } else {
    src_path = path.join(dst_path, '../', 'EDA_BS_WIN_bak');
  }
  log.info("rollback ....." + " ===> " + "src:" + src_path + ", dst:" + dst_path);
  command = "xcopy " + src_path + " " + dst_path + " /E/Y/C/I";
  return execute_script(command);
}


/**
 * 解压升级包
 * @param {升级包路径} zipFilePath 
 * @param {系统类型} systemType 
 */
window.unzip_upgrade_package = function(zipFilePath, systemType) {
  log.info("unzip .....")
  var app = remote.app
  var source_path = app.getAppPath();
  var zip_exe_path = app.getAppPath();
  if (source_path.includes('resources')) {
    zip_exe_path = path.join(source_path, '../../', '7z.exe');
    source_path = path.join(source_path, '../../../../..');
  }

  // 解压缩
  try {
    var commond = zip_exe_path + " x " + " -y " + zipFilePath + " -o" + source_path;
    return execute_script(commond);
  } catch (error) {
    console.error(error);
    return false;
  }


  // try {
  //   zipper.sync.unzip(zipFilePath, source_path);
  // } catch (error) {
  //   console.error(error);
  //   return false;
  // }
  // return true;
  

  // compressing.zip.uncompress(zipFilePath, source_path, {zipFileNameEncoding: 'GBK'}).then(callback(true)).catch(callback(false));
  // try {
  //   await compressing.zip.uncompress(zipFilePath, source_path, {zipFileNameEncoding: 'GBK'})
  //   console.log('unzip upgrade packege success !!');
  // } catch (error) {
  //   console.error(error);
  //   return false;
  // }
  // return true;
};


/**
 * 安装升级程序
 * @param {*} batFileName 
 * @param {*} args 
 */
window.install_upgrade_program = function(batFileName, args) {
  log.info("install .....")
  const app = remote.app
  let batFilePath = path.join(app.getAppPath(), '../../../../', batFileName)
  console.log("bat file path:" + batFilePath);
  var exist = fs.existsSync(batFilePath);
  if (!exist) {
    log.info("install ....." + " ==> " + batFilePath + " 文件不存在！！")
    return false;
  }
  log.info("install ....." + " ==> " + batFilePath + " 文件存在！！")
  // 执行卸载脚本
  return execute_script_file(batFilePath, args);
};

/**
 * 清空升级包
 * @param {*} zipFilePath 
 */
window.clear_upgrade_packege = function(zipFilePath) {
  log.info("clear .....")
  console.log("clear ....." + " ===> " + zipFilePath);
  command = "del " + zipFilePath;
  return execute_script(command);
}



/**
 * 操作注册表
 * @param {*} zipFilePath 
 */
window.action_register = function(act, mark) {
  log.info("action register .....")
  log.info("action register ....." + " ===> act:" + act + ", mark:" + mark);

  const app = remote.app
  let registerAction = path.join(app.getAppPath(), '../../', "registryAction.exe")
  log.info("action register ....." + " ===> registerAction:" + registerAction)
  var exist = fs.existsSync(registerAction);
  if (!exist) {
    log.info("action register ....." + " ==> " + registerAction + " 文件不存在！！")
    return false;
  }
  log.info("action register ....." + " ==> " + registerAction + " 文件存在！！")

  let bat = spawnSync('cmd.exe', ['/c', registerAction, act, mark]);
  if (bat.status != 0) {
    return false;
  }
  return true;
}


// 函数实现，参数单位 毫秒 ；
// 以下代码来自于互联网，具体出处已经不记得了；
async function sleep_and_await(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};


// 检查升级失败的次数 是否大于 阈值
window.check_upgrade_fail_number = function() {
  // const config = window.require("./config.json");
  var configFile = path.join(__dirname, "config.json")
  let config = fs.readFileSync(configFile);
  config = JSON.parse(config)
  if (config.length == 0) {
    config.fail.number = 1;
    config.fail.threshold = 2;
    config.fail.message = "连续升级失败，请联系公司运维人员！！";
  } else {
    config.fail.number = config.fail.number + 1;
  }
  fail_number = config.fail.number;
  if (fail_number > config.fail.threshold) {
    return config.fail.message;
  } else {
    try {
      fs.writeFileSync(configFile, JSON.stringify(config));
      log.info("记录升级失败次数成功！！");
    } catch (error) {
      log.info("记录升级失败次数失败！！");
      return "记录升级失败次数失败！！";
    }
  }
  return "";
}

// 升级成功后修改升级失败的次数
window.upgrade_success_update_number = function() {
  // const config = window.require("./config.json");
  var configFile = path.join(__dirname, "config.json")
  let config = fs.readFileSync(configFile);
  config = JSON.parse(config)
  if (config.length == 0) {
    config.fail.number = 0;
    config.fail.threshold = 2;
    config.fail.message = "连续升级失败，请联系公司运维人员！！";
  } else {
    config.fail.number = 0;
  }
  try {
    fs.writeFileSync(configFile, JSON.stringify(config));
    log.info("记录升级成功后修改记录成功！！");
    return "";
  } catch (error) {
    log.info("记录升级成功后修改记录失败！！");
    return "记录升级成功后修改记录失败！！";
  }
}

window.upgrade_fail_message = function() {
  // const config = window.require("./config.json");
  
  var configFile = path.join(__dirname, "config.json")
  let config = fs.readFileSync(configFile);
  config = JSON.parse(config)
  if (config.length == 0) {
    return "连续升级失败，请联系公司运维人员！！";
  }
  return config.fail.message;
}


window.checkout = function(number) {
  log.info('index.... ===> number:' + number)
  layui.use('element', function() {
    element = layui.element;
    element.progress('demo', number+'%');
  });
};


// // 解压文件
// window.unzip = async (flieName, systemType) => {
//   const app = remote.app
//   // const data = remote.getGlobal('sharedObject');
//   // console.log(data)
//   // 1、执行卸载脚本
//   exe_bat("uninstall.bat", systemType);
//   // 2、软件备份
//   let srcDir = path.join(app.getAppPath(), '../../../../');
//   var tempDir = path.join(path.getPath("temp"), 'EDAClient_BAK');
//   copyDir(srcDir, tempDir, function(err) {
//     if (err) {
//       console.log("srcDir:", srcDir);
//       console.log("tempDir:", tempDir);
//       console.log("copyDir error :", err);
//       upgrade_progress = -1;
//       return;
//     }
//   });

//   // 3、解压版本升级包
//   fs.exists(srcDir, async function (exists) {
//     if (!exists) {
//       fs.mkdirSync(srcDir);
//     } 
//     var zipFilePath = path.join(app.getPath("download"), flieName);
//     console.log('解压目标目录',srcDir);
//     console.log('解压文件路径',zipFilePath);


//     // 解压缩
//     compressing.zip.uncompress(zipFilePath, srcDir, {
//       zipFileNameEncoding: 'GBK'
//     }).then(() => {
//       console.log('success');
//       // 4、执行安装脚本
//       exe_bat('install.bat', systemType);
//     }).catch(err => {
//       console.error(err);
//       upgrade_progress = -1;
//       return;
//     });
//     // 中文乱码
//     // const zip = new StreamZip.async({ file: zipFile });
//     // const count = await zip.extract(null, zipTargetPath);
//     // console.log(`Extracted ${count} entries`);
//     // await zip.close();
    
//     // fs.createReadStream(zipFile).pipe(unzip.Extract({ path: zipTargetPath }))  //解压时直接会覆盖重名文件
//   });
// }


// window.exe_bat = function(batFileName, args) {
//   const app = remote.app
//   // const shell = remote.shell

//   let filePath = path.join(app.getAppPath(), '../../../../', batFileName)
//   console.log(filePath);
//   fs.exists(filePath, function(exists) {
//     if (!exists) {
//       console.log(filePath + " is not exist !!");
//       upgrade_progress = -1;
//       return false;
//     } 
//   })
//   // filePath = "F:\\EDA_WIN\\uninstall.bat 2> log.txt 1>&2"
//   // filePath = 'dir'
//   // exec(filePath, ,(err,  stdout, stderr) => {
//   //   if (err) {
//   //     console.error(err);
//   //     return;
//   //   }
//   //   console.log(stdout);
//   //   console.log(stderr);
//   // })

//   let bat = spawn('cmd.exe', ['/c', filePath]);
//   if (batFileName == "upgrade.bat") {
//     bat = spawn('cmd.exe', ['/c', filePath, args]);
//   }
  
//   var bufferHelper = new BufferHelper();

//   bat.stdout.on('data', (data) => {
//     bufferHelper.concat(data);
//   });

//   bat.stderr.on('data', (data) => {
//     //console.error(data.toString());
//     upgrade_progress = -1;
//     return false;
//   });
  
//   bat.stdout.on('end', () => {
//     var str = iconv.decode(bufferHelper.toBuffer(),'gbk');
//     console.log(str);
//   });

//   bat.on('exit', (code) => {
//     console.log(`Child exited with code ${code}`);
//     if (code === 0) {
//       upgrade_progress = 100;
//       return true;
//     } else {
//       upgrade_progress = -1;
//       return false;
//     }
//   });
//   // console.log(uninstall);
//   // shell.openPath(uninstall)
//   // console.log('success');
// };

// /*
//  * 复制目录、子目录，及其中的文件
//  * @param src {String} 要复制的目录
//  * @param dist {String} 复制到目标目录
//  */
// function copyDir(src, dist, callback) {
//   fs.access(dist, function(err){
//     if(err){
//       // 目录不存在时创建目录
//       fs.mkdirSync(dist);
//     }
//     _copy(null, src, dist);
//   });

//   function _copy(err, src, dist) {
//     if(err){
//       callback(err);
//     } else {
//       fs.readdir(src, function(err, paths) {
//         if(err){
//           callback(err)
//         } else {
//           paths.forEach(function(path) {
//             var _src = src + '/' +path;
//             var _dist = dist + '/' +path;
//             fs.stat(_src, function(err, stat) {
//               if(err){
//                 callback(err);
//               } else {
//                 // 判断是文件还是目录
//                 if(stat.isFile()) {
//                   fs.writeFileSync(_dist, fs.readFileSync(_src));
//                 } else if(stat.isDirectory()) {
//                   // 当是目录是，递归复制
//                   copyDir(_src, _dist, callback)
//                 }
//               }
//             })
//           })
//         }
//       })
//     }
//   };
// }