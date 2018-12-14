
// 修改歷程記錄
// 2017/08/16   jackie      初版建立
//
//
//
//
//





// 程式運作規則
//
// 1.從 [AnalyticsConvert.js]-AnalyticsListen() 接收播放或載入影片資訊.
// 2.AnalyticsListen()發現若有新資料或需要傳遞時.則呼叫 [Analytics.js]-AnalyticsSendToQueue(pJSON) 將資料放入儲列中.並在資料前放入一個標記資訊 "[WAIT]," 代表等候傳送
// 3.若超過指定最大保留數量 (AnalyticsQueueArraySize) 則刪除最舊的資料
// 4.每次傳遞間隔時間為 AnalytiInterval 秒數.預設為 30 秒.
// 5.於預備上傳資料到分系伺服器時.會先將"[WAIT]," 標記改為 "[SEND],".若傳遞成功會將標記為 "[SEND]," 資料刪除.
//   若傳遞失敗時,會將標記為 "[SEND]," 標記改為 "[WAIT],"


// 需要在原始程式調整部分
//
// 1.複製三個檔案到 [SamplePlayer\sampleplayer\app\lib] 位置
//      Analytics.js 
//      AnalyticsConvert.js
//      UserAgent.js
// 
// 並在首頁中加入以下宣告
//     <script src="app/lib/AnalyticsConvert.js"></script>
//     <script src="app/lib/Analytics.js"></script>
//     <script src="app/lib/UserAgent.js"></script>
// 
// 
// 
// 2.加入 CUID 資訊
// 在 [sampleplayer\app\lib\Analytics.js] 檔案中.尋找
// AnalyticsCuidSet("CUID_HERE");
// 這一行程式,並將 CUID 之取得規格加入到此行
// 
// 
// 
// 3.回應下載速度不足通知
// function  BufferInsufficientNotify(SelectBitrate, DownloadBitrate){}
// 當下載影片後,發生下載的 DownloadBitrate 低於目前播放中的 SelectBitrate 時. 系統會回應此函數通知
// 請在函數內設計.處裡動作
// 
// 
// 




var VERSION="1.1.2";    // Analytics 系統版本




// 系統公用變數區
// 分析伺服器網址 http://220.228.38.27:18080/postEvent
// http://203.69.207.187:8080/postEvent
// https://ana.friday.tw/postEvent
var AnalyticsURLs="https://ana.video.friday.tw/postEvent";   



// VisualOn 版本
var voversion="";

//var ClientIPGetServer="https://ifcfg.me/ip";
//var ClientIPGetServer="http://203.69.207.187:8080/ip.jsp";
//var ClientIPGetServer="https://203.69.207.187/ip.jsp";
var ClientIPGetServer="https://ana.video.friday.tw/ip.jsp";
var ClientIP="0.0.0.0";           // 用戶端IP


// 上傳定時器.
var TimeObjectAnalytics;        // 計時接受器物件名稱
var AnalytiInterval = 30000;    // 最大傳送時間,30000 = 30秒 = 除了 open 與 stop 外.每30秒傳送一次


// 上傳資料緩衝區
var AnalyticsDataQueue          = new Array();  // 目前排程儲列. 陣列[0]不使用
var AnalyticsDataNowCount       = 0;            // 目前排程中的資料數量 0=沒有資料
var AnalyticsQueueArraySize     = 2000;         // 最大緩衝區保留筆數 10000=最大保留10000筆. 由於系統預設每30秒傳送一次,建議此值至少大於 300 以上


// 以下資訊透過呼叫 AnalyticsCuidSet() 產生
var AnalyticsDeviceID   = "";   // 設備ID
var AnalyticsCUID       = "";   // 系統商自訂編號
var AnalyticsModel      = "";   // 撥放器型號
var AnalyticsOS         = "";   // 撥放器作業系統
var AnalyticsSessionID  = "";   // 每一播放影片編號.若收到的資料中有出現 "t":"open" 資訊時,則自動產生
var AnalyticsVersion    = "";   // 撥放器版本.若為Browser 時,則為 Plugin 版本.號.若收到的資料中有出現 "t":"open" 資訊時,則自動產生
var AnalyticsSendHeaderString = "";  // 以上資訊 JSON 緩衝字串


// JSON 關鍵字辨識碼
var defPauseKeyword     = '"pause","ts":';  // 收到此資訊時,代表影片執行暫停.強制傳送一次 "t":"pause" / "pause","ts":
var defOpenKeyword      = '"open","ts":';   // 收到此資訊時,代表影片開始撥放.強制傳送一次 "t":"open" / "open","ts":
var defEndKeyword       = '"end","ts":';    // 收到此資訊時,代表影片結束撥放.強制傳送一次 "t":"end" / "end","ts":
var defInsertSidKeyword = '"t":';           // 插入 sid 資訊識別碼



// 初始化 analytics export
// 此程式呼叫必須放置於 (basePlayer.js)function initWebpage(objID, callbackFunction) 最後一行
var AnalyticsInitinzeStatus=false;  // 分析主程式是否已經初始化
function AnalyticsInitinze()
{
    var i;
    var mStr="";

    if(AnalyticsInitinzeStatus)
        return;

    parseSystemLog("__Clear_All_Array_Data__");

    // 由於HTML5 無法產生unique id.因此製作一個unique id後並把他存放在cookie中.
    AnalyticsDeviceID   = cookieGet("did");
    if(AnalyticsDeviceID.length<28)
    {
        AnalyticsDeviceID = CreateDeviceID();
        cookieSet("did", AnalyticsDeviceID);
    }

    AnalyticsDataNowCount = 0;

    // 初始化Queue 資料內容
    for(i=0;i<AnalyticsQueueArraySize+10;i++)
        AnalyticsDataQueue[i] = "";

    // 開啟分析功能
    //eAnalyticsExport.checked = true;
    //callFuncWithParam('enableAnalyticsExport', eAnalyticsExport.checked);
    //callFuncWithParam('setAnalyticsExportListener', onVOAnalyticsEvent);

    // 設定 CUID
    AnalyticsCuidSet("CUID_HERE");  // 加在這裡

    // 啟用計時器
    TimeObjectAnalytics = setTimeout("AnalyticsSendDataTimeObject()", AnalytiInterval);

    HttpDataGet(ClientIPGetServer,"");
    
    AnalyticsInitinzeStatus = true;
}


// 取得 DeviceID
function AnalyticsDeviceIDGet()
{
    AnalyticsDeviceID   = cookieGet("did");
    if(AnalyticsDeviceID.length<28)
    {
        AnalyticsDeviceID = CreateDeviceID();
        cookieSet("did", AnalyticsDeviceID);
    }
    return AnalyticsDeviceID;
}


// 產生並傳回一組 DeviceID
function CreateDeviceID()
{
    var array1 = new Array("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","+","/");
    var i;
    var mData=""
    var v;
    
    for(i=0;i<14;i++)
    {
        v = Math.floor(Math.random() * 4096) % 62;
        mData = mData +array1[v];
    }
    for(i=14;i<28;i++)
    {
        v = Math.floor(Math.random() * 4096) % 64;
        mData = mData +array1[v];
    }
    return mData;
}



// 補充資訊
// 在每一個物件中.補充增加的資訊
// 參數說明
//  CUID : Called User Identification number .被叫用戶識別號,由系統業者自訂
function AnalyticsCuidSet( pCUID)
{
    var mUserAgent=navigator.userAgent;

    AnalyticsCUID   = pCUID;
    AnalyticsModel  = userAgentModelGet(mUserAgent);
    AnalyticsOS     = userAgentOSGet(mUserAgent);
}


// 輸入資料到傳送儲列中
// 請在 VOCommonPlayerAnalytics.prototype.getAnalyticsExportPacket = function() 離開前加入以下呼叫
//VOCommonPlayerAnalytics.prototype.getAnalyticsExportPacket = function()
//{
//    var fae = "";
//    fae = this.player.getAnalyticsExportPacket();
//    AnalyticsSendToQueue(fae);  // 加入這行
//    return fae;
//}
// AnalyticsSendToQueue(pJSON);
function AnalyticsSendToQueue(pJSON)
{
    var i;
    var mJsonData;
    var mLen;
    var mStr;

    // 預處理機制.
    // 若 pJSON 字串中,有夾帶 "t":"open" 時,則自動產生 AnalyticsSessionID / AnalyticsVersion 兩項資訊
    //var AnalyticsSessionID; // 每一播放影片編號.若收到的資料中有出現 "t":"open" 資訊時,則自動產生
    //var AnalyticsVersion;   // 撥放器版本.若為Browser 時,則為 Plugin 版本.號.若收到的資料中有出現 "t":"open" 資訊時,則自動產生
    //var AnalyticsSendHeaderString;   // 以上資訊 JSON 緩衝字串

    AnalyticsInitinze();

    if(pJSON==null)
        return;
    if(pJSON.length<10)
    {
        // 若文字長度不足 10字元,則離開
        return;
    }


    mJsonData = pJSON;
    // 移除陣列前後 '[',']' 括弧
    mJsonData = mJsonData.replace("[","");
    mJsonData = mJsonData.replace("]","");


    // 檢查是否出現 open 關鍵字.若出現實則產生相關資訊
    mLen = mJsonData.indexOf(defOpenKeyword);
    if(mLen!=-1)
    {
        // 若出現關鍵字.則加入一個物件.並產生相關資訊
        AnalyticsVersion    = voversion;    // visualOn 系統參數

        mLen += defOpenKeyword.length;
        AnalyticsSessionID = mJsonData.substring(mLen+0,mLen+14);
        AnalyticsSessionID = AnalyticsSessionID.replace(",","");

        AnalyticsSendHeaderString = '"did":"' + AnalyticsDeviceID + '",';
        AnalyticsSendHeaderString += '"sid":' + AnalyticsSessionID + ',';
        AnalyticsSendHeaderString += '"t":"info",';
        AnalyticsSendHeaderString += '"ts":UnixTimestamp,';
        AnalyticsSendHeaderString += '"cuid":"' + AnalyticsCUID + '",';
        AnalyticsSendHeaderString += '"model":"' + AnalyticsModel + '",';
        AnalyticsSendHeaderString += '"os":"' + AnalyticsOS + '",';
        AnalyticsSendHeaderString += '"ver":"' + AnalyticsVersion + '"';
        AnalyticsSendHeaderString = "{" + AnalyticsSendHeaderString.replace(/ /g,"") + "},";
        //debug_dlm_output(AnalyticsSendHeaderString);
    }


    // 為每一個物件.插入 sid
    mStr = '"did":"' + AnalyticsDeviceID + '"' + ',"sid":' + AnalyticsSessionID + ',' ;
    mJsonData = mJsonData.replace(new RegExp(defInsertSidKeyword, 'g'), mStr + defInsertSidKeyword);


    // 將資料標記為等待傳送 "[WAIT],"
    AnalyticsDataNowCount ++;
    AnalyticsDataQueue[AnalyticsDataNowCount] = "[WAIT]," + mJsonData;


    // 將資料排入儲列中
    if(AnalyticsDataNowCount>AnalyticsQueueArraySize)    // 若超過最大緩衝保留數量.則移除最舊的一筆(陣列中第一筆).其他資料依次向上推移一筆
    {
        // 若超過最大保留數量時.則刪除最舊的一筆紀錄
        for(i=1;i<AnalyticsDataNowCount;i++)
        {
            AnalyticsDataQueue[i]=AnalyticsDataQueue[i+1];
        }
        AnalyticsDataQueue[AnalyticsDataNowCount]="";
        AnalyticsDataNowCount--;
    }

    // 收到 open 或是 stop 與 pause 事件.則優先傳送
    if(pJSON.indexOf(defOpenKeyword)!=-1 || pJSON.indexOf(defEndKeyword)!=-1 || pJSON.indexOf(defPauseKeyword)!=-1)
    {
        AnalyticsSendDataTimeObject();
    }
}



// 定時器,預設為每 AnalytiInterval/1000 秒.執行一次
function AnalyticsSendDataTimeObject()
{
    var mStr;
    var mSendData;  // 需要傳送的資料
    var SendMark;   // 是否有資料需要傳送標記 false:沒有資料需要傳送
    var i;
    //var v;

    clearTimeout(TimeObjectAnalytics);

    SendMark = false;


    // 取回陣列中.有標記為 "[WAIT]," 資料項目
    mSendData = ""
    for(i=1;i<AnalyticsDataNowCount+2;i++)
    {
        mStr = AnalyticsDataQueue[i].toString();
        
        if(mStr.indexOf(defOpenKeyword)!=-1)
        {
            // 搜尋到 defOpenKeyword 關鍵字時.若前面有資料時,則先送一次
            if(mSendData.length>10)
            {
                break;
            }
        }

        if (mStr.indexOf("[WAIT],")!=-1)
        {
            SendMark = true;
            AnalyticsDataQueue[i] = AnalyticsDataQueue[i].replace("[WAIT],","[SEND],");
            mStr = mStr.replace("[WAIT],","");

            if (i==1)
            {
                mSendData = mStr;
            }
            else
            {
                mSendData = mSendData + "," + mStr;
            }
        }
        // 若文字辨識為 "stop" 時,則傳送
        if(mStr.indexOf(defEndKeyword)!=-1)
        {
            AnalyticsSessionID = 0;
            break;
        }
        // 若本次傳送大於32768Bytes則傳送
        if(mSendData.length>32768)
        {
            debug_dlm_output("傳送資料大於 32768Bytes\n");
            break;
        }
    }

    if(SendMark)
    {
        // 傳送資料到分析伺服器
        // 檢查ClientIP 是否正確,若不正確則換成 "0.0.0.0"
        //ClientIP = "221.122.123.124";
        var s=ClientIP.split(".");
        if(s.length==4)
        {
            for(var mi=0;mi<s.length;mi++)
            {
                if(parseInt(s[mi])>255 || parseInt(s[mi])<0 || isNaN(parseInt(s[mi])))
                {
                    ClientIP = "0.0.0.0";
                    break;
                }
            }
        }
        else
        {
            ClientIP = "0.0.0.0";
        }
        mSendData +=',{"did":"' + AnalyticsDeviceID + '","sid":' + AnalyticsSessionID + ',"t":"ip","ts":' + UnixTimestampGet() + ',"addr":"' + ClientIP + '"}';
        debug_dlm_output("傳送資料到分析伺服器\n");
        HttpSendPost(mSendData);
    }
    else
    {
        AnalyticsDataNowCount = 0;
        debug_dlm_output("沒有資料\n");
        TimeObjectAnalytics = setTimeout("AnalyticsSendDataTimeObject()", AnalytiInterval);
    }

}


var AsyncResponseValue="";  // 非同步化請求回傳值
// 傳送分析資料到伺服主機
var HttpSendPost=function(pSendData)
{
    var i;
    var SendString="";
    var mStr="";

    SendString = "[" + AnalyticsSendHeaderString + pSendData + "]";

    // 置換 UnixTimestamp
    mStr = String(UnixTimestampGet());
    SendString = SendString.replace("UnixTimestamp", mStr);

    SendString = SendString.replace(new RegExp('},,{', 'g'), '},{');
    debug_dlm_output(SendString + "\n");

    AsyncResponseValue = "";
    $.ajax({
        url: AnalyticsURLs, // 前往呼叫的網域名稱
        data: SendString,   // URL 後面的參數    $('#sentToBack').serialize(),
        type:"POST",        // 傳遞資料方式 GET/POST ,預設為 GET
        dataType:"text",    // 傳送時必須為 "text"
        crossDomain: true,  // 跨網域存取
        async:true,         // 非同步化要求.若為 false 時(鎖定強制執行).則會導致網頁鎖定.直到 AJAX 結束後才恢復正常
        //cache:false,      // 預設為 true,1.2版加入的新功能，設定成flase就不會從瀏覽器中抓cache住的舊資料。
        //useDefaultXhrHeader: false,
        success: function(data, status, xhr)  // 當取回資料正確執行後,觸發本事件 msg=從server回傳資料
        {
            //debug_dlm_output("data:" + data); // server 端回傳資料
            //debug_dlm_output("status:" + status);   // 若為成功時傳回 "success"
            //debug_dlm_output("xhr.status:" + (xhr.status));   // 若為成功時傳回 200
            if (xhr.status==200)
                AsyncResponseValue = "success";
            else
                AsyncResponseValue = "error";
        },
        error: function(xhr, ajaxOptions, thrownError)  // 當取回資料發生錯誤後,觸發本事件
        {
            AsyncResponseValue = "error";
            //alert("error no:" + xhr.status);  // 錯誤編號:200 成功.404 沒有頁面
            //alert("error:" + thrownError);    // 錯誤文字描述
        }
    });


    // 事後檢查傳送資訊是否正確
    TimeObjectSyncCheck = setTimeout("AnalyticsSynchronizationCheck()", 50);
}



var TimeObjectSyncCheck;    // 非同步化接受器物件名稱
// 檢查非同步化發送資料是否正確
function AnalyticsSynchronizationCheck()
{
    clearTimeout(TimeObjectSyncCheck);

    if(AsyncResponseValue.length<2)
    {
        // 若沒有資料.則隔1秒在進來檢查
        TimeObjectSyncCheck = setTimeout("AnalyticsSynchronizationCheck()", 1000);
        return ;
    }


    debug_dlm_output("傳送狀態:" + AsyncResponseValue + "\n");
    if (AsyncResponseValue.indexOf("success")!=-1)
    {
        //alert("success");
        // 資料傳遞成功.將資料移除
        for(i=1;i<AnalyticsDataNowCount+2;i++)
        {
            if (AnalyticsDataQueue[i].indexOf("[SEND],")!=-1)
                AnalyticsDataQueue[i] = "";
        }
    }
    else
    {
        //alert("error");
        // 資料傳遞失敗.將資料從 "[SEND]," 復原回 "[WAIT],"
        for(i=1;i<AnalyticsDataNowCount+2;i++)
        {
            mStr = AnalyticsDataQueue[i];
            if (mStr.indexOf("[SEND],")!=-1)
                AnalyticsDataQueue[i] = mStr.replace("[SEND],","[WAIT],");
        }
    }

    // 完成請求.重新啟用計時器
    TimeObjectAnalytics = setTimeout("AnalyticsSendDataTimeObject()", AnalytiInterval);

    HttpDataGet(ClientIPGetServer,"");

}




var HttpDataGet=function(pURI, pData){

    $.ajax({
        url: pURI,          // 前往呼叫的網域名稱
        data: pData,        // URL 後面的參數    $('#sentToBack').serialize(),
        type:"GET",        // 傳遞資料方式 GET/POST ,預設為 GET
        dataType:"text",    // 傳送時必須為 "text"
        crossDomain: true,  // 跨網域存取
        async:true,         // 非同步化要求.若為 false 時(鎖定強制執行).則會導致網頁鎖定.直到 AJAX 結束後才恢復正常
        //cache:false,      // 預設為 true,1.2版加入的新功能，設定成flase就不會從瀏覽器中抓cache住的舊資料。
        //useDefaultXhrHeader: false,
        success: function(data, status, xhr)  // 當取回資料正確執行後,觸發本事件 msg=從server回傳資料
        {
            //debug_dlm_output("data:" + data); // server 端回傳資料
            //debug_dlm_output("status:" + status);   // 若為成功時傳回 "success"
            //debug_dlm_output("xhr.status:" + (xhr.status));   // 若為成功時傳回 200
            if (xhr.status==200)
            {
                ClientIP = data;
                ClientIP = ClientIP.replace("\n","");
                ClientIP = ClientIP.replace("\r","");
            }
            else
            {
                if(ClientIP.length<9)
                    ClientIP = "0.0.0.0";
            }

        },
        error: function(xhr, ajaxOptions, thrownError)  // 當取回資料發生錯誤後,觸發本事件
        {
            //alert("xhr.status:"+xhr.status);
            //alert("xhr.responseText:"+xhr.responseText);
            //alert("thrownError:"+thrownError);
            //alert("ajaxOptions:"+ajaxOptions);
            if(ClientIP.length<9)
                ClientIP = "0.0.0.0";
        }
    });
}









// 傳回 unix timestamp 數值 ex:1499931128068
function UnixTimestampGet()
{
    const dateTime = Date.now();
    const timestamp = Math.floor(dateTime );
    return timestamp;
}


// 令網頁休眠
function sleep(milliseconds)
{
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) 
    {
        if ((new Date().getTime() - start) > milliseconds)
        {
            break;
        }
    }
}




// utility cookie
// 設定 cookie 變數
// c_name:變數名稱
// value:資料
// expiredays:資料在cookie 中保留天數,若忽略此參數時.將成為預設365天
// ex: cookieSet('jackie','cascasqwefsd', 3) 變數 jackie='cascasqwefsd' 保留3天
// ex: cookieSet('jackie','cascasqwefsd', -1) 將變數 jackie 內容清空.
// ex: cookieSet('jackie','cascasqwefsd') 變數 jackie='cascasqwefsd' 保留365天
function cookieSet(c_name, value, expiredays=365)
{
    var d = new Date();
    d.setTime(d.getTime() + (expiredays * 24 * 60 * 60 * 1000));   // 日*小時*分鐘*秒數*微秒
    var expires = d.toGMTString();
    document.cookie = c_name + "=" + escape(value) + "; expires=" + expires ;// + '; domain=blog.longwin.com.tw; path=/';    
}


// 取回 cookie 變數資料
// c_name:變數名稱
function cookieGet(c_name)
{
    if (document.cookie.length>0)
    {
        var c_start=document.cookie.indexOf(c_name + "=")
        if (c_start!=-1)
        {
            c_start = c_start + c_name.length+1;
            var c_end = document.cookie.indexOf(";", c_start);
            if (c_end==-1)
                c_end = document.cookie.length;
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}




// 將訊息匯出到 Export 頁面
function debug_dlm_output(pMsg)
{
    if (1==1)   // 將這一行改成 1==2時.則不再輸出訊息
    {
        try {
            var MyMessage=document.getElementById("MyMsg");
            MyMessage.value += pMsg;
            //console.log("▼▼" + pMsg );
        }
        catch (e) {
            //logMyErrors(e) // 把例外物件傳給錯誤處理器
            console.log("███" + pMsg );
        }
    }
}


// 當下載影片後,發生下載的 DownloadBitrate 低於目前播放中的 SelectBitrate 時. 系統會回應此函數通知
// SelectBitrate:目前撥放器所選擇的 Bitrate
// DownloadBitrate:下載一段 trunk 的 Bitrate
// 注意事項.此回應函數或需要提出通知.建議於30秒內連續發生兩次以上時.再提出通知較為理想
function  BufferInsufficientNotify(SelectBitrate, DownloadBitrate)
{
    console.log("██████████BufferInsufficientNotify██ SelectBitrate:" + SelectBitrate + "  DownloadBitrate:" + DownloadBitrate + "\n");
}

