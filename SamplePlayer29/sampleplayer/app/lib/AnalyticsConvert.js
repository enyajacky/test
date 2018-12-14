// 等待製作功能 2017 08 22
// https://edge01t.friday.tw/live/fet003/manifest.mpd?token=abe15180fe38a38a17687ac3f634385f 需要加  token
// 取得 token http://203.69.207.187:8080/token2.jsp




// streaming fps    30/24/29.97
// 每秒 之 FPS
// ex:{"did":"LozQFD33j+mDxZ4AFgHX8U2k/4E=","sid":1503453423119,"t":"sfr","ts":1503453429317,"fps":29.980000}
// 
// 
// video type : live or vod
//  type="dynamic"live / type="static"vod
// ex:{"did":"LozQFD33j+mDxZ4AFgHX8U2k/4E=","sid":1503453423119,"t":"vt","ts":1503453532389,"fmt":"LIVE"}
// 
// 
// 
// frame drop
// 目前播放之檔案,於傳送到分系伺服器之區間時間.所產生之所有 dropped frame數量數量
// 1frame
// ex:{"did":"LozQFD33j+mDxZ4AFgHX8U2k/4E=","sid":1503453423119,"t":"frdrp","ts":1503453532389,"ps":253001}
// 
// 
// 










// frame total
// 目前播放之檔案,於傳送到分系伺服器之區間時間內.所產生之所有 frame
// (30s*30frame)
// ex:{"did":"LozQFD33j+mDxZ4AFgHX8U2k/4E=","sid":1503453423119,"t":"ft","ts":1503453532389,"fstps":1503453532389,"lstps":1503453562389,"tnf":900}
// 
// 
// playling fps   30-2=28
// 撥放器每秒成功播放平均幀數.目前播放之檔案.fps 於傳送到分系伺服器之區間時間.所產生之所有 frame減掉dropped frame數量後除以傳送伺服器區間之時間秒數
// ((30s*30frame)-10)/30s 
// 
// 
// 







// 
// AnalyticsConvert.js 程式功能說明
// 
// 1.攔截系統log 資訊.產生產生分析 JSON 格式資料
// 2.將產生之 JSON 格式分析資料.送到 [Analytics.js]->AnalyticsSendToQueue() 等待傳送到分系紀錄伺服器
// 3.下載速度低於影片選取之bitrate時,發出BufferInsufficientNotify()
// 
// 
// 
// 
// 


// 驗證錯誤方式
// 1.檔名不正確
// 2.網路嚴重延遲
// 3.檔案格式不支援


// 資料分析器.將 HTML5 撥放器資料.轉換成為 visual on 格式.
var AnalyticsPlayerStatus=false;    // 撥放器目前狀態.若為撥放中則為 true
//var SendBufferString="";
var oldVideoBandwidth=-10;  // 撥放影音 bit rate (紀錄用途)
var newVideoBandwidth=-10;  // 撥放影音 bit rate
var VideoFrameRate=0;       // 此影片之 FPS
var DropFrameCount=0;       // 此影片總計掉落封包數量
var videoSourceLiveOrVOD="";    // 影片源是否為 VOD, videoSourceLiveOrVOD="VOD"時代表為 VOD影片, videoSourceLiveOrVOD="LIVE"時代表為 live影片

// 參數
//  pErrorCode      : 錯誤碼 0:訊息     2164260865~2164260881:錯誤代碼
//  pMessage        : 資料或訊息型態
//  pCurrentUrl     : 目前撥放影片URL
//  pIsMute         : 是否為靜音
//  pVolumeValue    : 目前音量 0~1
//  pTotalTime      : 此影片總計時間秒數
//  pCurrentTime    : 目前撥放影片位置 (秒)包含有小數點
//  pPlaybackCompleted  : true 可以撥放 / false:不能撥放或未載入
//  pHtml5Version       : HTML5 版本
var mCurrentTime=0; // 當前影片時間,有小數點
function AnalyticsListen(pErrorCode, pMessage, pCurrentUrl, pIsMute, pVolumeValue, pTotalTime, pCurrentTime, pPlaybackCompleted, pHtml5Version)
{
    voversion = pHtml5Version;

    var JSON="";
    var sid;
    var ts;
    var uri;
    var RetCode="";

    mCurrentTime = pCurrentTime;
    //debug_dlm_output("pCurrentTime:" + pCurrentTime + "\n");


    if (pErrorCode!=0)
    {
        // 發生錯誤
        // 2164260865 (0x81000001)  VO_OSMP_SRC_ERR_FORMAT_UNSUPPORT
        // 2164260866 (0x81000002)  VO_OSMP_SRC_ERR_CODEC_UNSUPPORT
        // 2164260867 (0x81000003)  VO_OSMP_SRC_ERR_BROWSER_UNSUPPORT_MSE
        // 2164260868 (0x81000004)  VO_OSMP_SRC_ERR_MANIFEST_DOWNLOAD_FAIL 影片不存在
        // 2164260869 (0x81000005)  VO_OSMP_SRC_ERR_MANIFEST_PARSE_FAIL
        // 2164260870 (0x81000006)  VO_OSMP_SRC_ERR_CONTENT_DOWNLOAD_FAIL
        // 2164260871 (0x81000007)  VO_OSMP_SRC_ERR_CONTENT_PARSE_FAIL
        // 2164260872 (0x81000008)  VO_OSMP_SRC_ERR_TEXT_TRACK_PARSE_FAIL
        // 2164260873 (0x81000009)  VO_OSMP_SRC_ERR_SOURCE_BUFFER_ERROR
        // 2164260874 (0x8100000A)  VO_OSMP_SRC_ERR_OUTMEMORY
        // 2164260875 (0x8100000B)  VO_OSMP_SRC_ERR_UNKNOWN
        // 2164260876 (0x8100000C)  VO_OSMP_DRM_ERR_BROWSER_UNSUPPORT
        // 2164260877 (0x8100000D)  VO_OSMP_DRM_ERR_KEY_FAIL
        // 2164260878 (0x8100000E)  VO_OSMP_DRM_ERR_KEY_SESSION_FAIL
        // 2164260879 (0x8100000F)  VO_OSMP_DRM_ERR_LICENSE_REQUEST_FAIL
        // 2164260880 (0x81000010)  VO_OSMP_DRM_ERR_SELECT_KEY_SYSTEM_FAIL
        // 2164260881 (0x81000011)  VO_OSMP_DRM_ERR_DECRYPT_FAIL
        switch(pErrorCode)
        {
        case 0x81000001:
            debug_dlm_output("VO_OSMP_SRC_ERR_FORMAT_UNSUPPORT\n");
            break;

        case 0x81000002:
            debug_dlm_output("VO_OSMP_SRC_ERR_CODEC_UNSUPPORT\n");
            break;

        case 0x81000003:
            debug_dlm_output("VO_OSMP_SRC_ERR_BROWSER_UNSUPPORT_MSE\n");
            break;

        case 0x81000004:
            debug_dlm_output("VO_OSMP_SRC_ERR_MANIFEST_DOWNLOAD_FAIL\n");
            break;

        case 0x81000005:
            debug_dlm_output("VO_OSMP_SRC_ERR_MANIFEST_PARSE_FAIL\n");
            break;

        case 0x81000006:
            debug_dlm_output("VO_OSMP_SRC_ERR_CONTENT_DOWNLOAD_FAIL\n");
            break;

        case 0x81000007:
            debug_dlm_output("VO_OSMP_SRC_ERR_CONTENT_PARSE_FAIL\n");
            break;

        case 0x81000008:
            debug_dlm_output("VO_OSMP_SRC_ERR_TEXT_TRACK_PARSE_FAIL\n");
            break;

        case 0x81000009:
            debug_dlm_output("VO_OSMP_SRC_ERR_SOURCE_BUFFER_ERROR\n");
            break;

        case 0x8100000A:
            debug_dlm_output("VO_OSMP_SRC_ERR_OUTMEMORY\n");
            break;

        case 0x8100000B:
            debug_dlm_output("VO_OSMP_SRC_ERR_UNKNOWN\n");
            break;

        case 0x8100000C:
            debug_dlm_output("VO_OSMP_DRM_ERR_BROWSER_UNSUPPORT\n");
            break;

        case 0x8100000D:
            debug_dlm_output("VO_OSMP_DRM_ERR_KEY_FAIL\n");
            break;

        case 0x8100000E:
            debug_dlm_output("VO_OSMP_DRM_ERR_KEY_SESSION_FAIL\n");
            break;

        case 0x8100000F:
            debug_dlm_output("VO_OSMP_DRM_ERR_LICENSE_REQUEST_FAIL\n");
            break;

        case 0x81000010:
            debug_dlm_output("VO_OSMP_DRM_ERR_SELECT_KEY_SYSTEM_FAIL\n");
            break;

        case 0x81000011:
            debug_dlm_output("VO_OSMP_DRM_ERR_DECRYPT_FAIL\n");
            break;
        }
        RetCode = '{"t":"err","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + ',"rsn":' + pErrorCode + '}';
    }
    else
    {
        // VO_OSMP_CB_PLAY_STARTED
        // VO_OSMP_CB_PLAY_PAUSED,
        // VO_OSMP_CB_PLAY_WAITING,
        // VO_OSMP_CB_PLAY_PLAYING,
        // VO_OSMP_SRC_ADAPTIVE_STREAMING_INFO_EVENT_BITRATE_CHANGE,
        // VO_OSMP_CB_PLAY_TIME_UPDATED,
        // VO_OSMP_CB_SEEK_COMPLETE,
        // VO_OSMP_SRC_CB_OPEN_FINISHED,
        // VO_OSMP_CB_PLAY_COMPLETE,
        // VO_OSMP_SRC_CB_PROGRAM_CHANGED,
        // VO_LOG_SERVER_CONNECTED,
        // VO_LOG_SERVER_DISCONNECTED,
        // VO_OSMP_CB_LOG_ADDED,
        // VO_OSMP_CB_ERROR_EVENTS,
        // VO_OSMP_CB_PIP_MODE_CHANGED
        // VO_OSMP_CB_STOP_COMPLETE,    阿旺新增

        if(pMessage.indexOf("VO_")!=-1 )
        {
            if(pMessage.indexOf("VO_INTERNAL_MEDIA_SELECTED")!=-1 )
            {
                // 初始化所有變數
                AnalyticsSessionID = 0;
                VideoFrameRate = 0;
                DropFrameCount = 0;
                videoSourceLiveOrVOD = "";
                newVideoBandwidth = 0;
                oldVideoBandwidth = 1;
                parseSystemLog("__Clear_All_Array_Data__");
                
                // 程序10.開啟影片通知.開啟不一定成功.若URL錯誤時.則產生錯誤碼.若成功開啟後進入程序20.
                if (AnalyticsPlayerStatus)
                {
                    RetCode = '{"t":"end","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + '}';
                    AnalyticsSendToQueue(RetCode);
                }
                debug_dlm_output(" VO_INTERNAL_MEDIA_SELECTED  URL:" + pCurrentUrl + "\n");
                debug_dlm_output("AnalyticsDeviceID:" + AnalyticsDeviceIDGet() + "  pIsMute:"+pIsMute + "  pVolumeValue:"+pVolumeValue  + "  pTotalTime:"+pTotalTime  + "  pCurrentTime:"+pCurrentTime  + "  pPlaybackCompleted:"+pPlaybackCompleted   +"\n");
            }
            else if(pMessage.indexOf("VO_OSMP_SRC_CB_OPEN_FINISHED")!=-1 )
            {
                // 程序20.影片檔案開啟成功
                // {"t":"open","ts":1502346046010,"uri":"https://edge01t.friday.tw/bps/658.smil/manifest.mpd"}.
                RetCode = '{"t":"open","ts":' + UnixTimestampGet() + ',"uri":"' + pCurrentUrl + '"}';
                if(VideoFrameRate>10)
                    RetCode += ',{"t":"sfr","ts":' + UnixTimestampGet() + ',"fps":' + VideoFrameRate + '}';
                if(videoSourceLiveOrVOD.length>1)
                    RetCode += ',{"t":"vt","ts":' + UnixTimestampGet() + ',"fmt":"' + videoSourceLiveOrVOD + '"}';
                AnalyticsPlayerStatus = true;
                debug_dlm_output(" VO_OSMP_SRC_CB_OPEN_FINISHED  URL:" + pCurrentUrl + "\n");
                debug_dlm_output("  pIsMute:"+pIsMute + "  pVolumeValue:"+pVolumeValue  + "  pTotalTime:"+pTotalTime  + "  pCurrentTime:"+pCurrentTime  + "  pPlaybackCompleted:"+pPlaybackCompleted   +"\n");
            }
            else if(pMessage.indexOf("VO_OSMP_CB_PLAY_STARTED")!=-1 )
            {
                // 程序30.影片開始準備撥放
                debug_dlm_output("VO_OSMP_CB_PLAY_STARTED\n");
            }
            else if(pMessage.indexOf("VO_OSMP_CB_PLAY_WAITING")!=-1 )
            {
                // 程序40.影片撥放期間等待.buffering
                RetCode = '{"t":"buffer","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + '}';
                debug_dlm_output("VO_OSMP_CB_PLAY_WAITING\n");
            }
            else if(pMessage.indexOf("VO_OSMP_CB_PLAY_PLAYING")!=-1 )
            {
                // 程序50.影片撥放中
                RetCode = '{"t":"playing","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + '}';
                debug_dlm_output("VO_OSMP_CB_PLAY_PLAYING\n");
                debug_dlm_output("  pIsMute:"+pIsMute + "  pVolumeValue:"+pVolumeValue  + "  pTotalTime:"+pTotalTime  + "  pCurrentTime:"+pCurrentTime  + "  pPlaybackCompleted:"+pPlaybackCompleted   +"\n");
            }
            else if(pMessage.indexOf("VO_OSMP_CB_PLAY_PAUSED")!=-1 )
            {
                // 影片撥放期間暫停動作
                RetCode = '{"t":"pause","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + '}';
                debug_dlm_output("VO_OSMP_CB_PLAY_PAUSED\n");
            }
    
            else if(pMessage.indexOf("VO_OSMP_CB_SEEK_COMPLETE")!=-1 )
            {
                RetCode = '{"t":"seek","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + '}';
                AnalyticsPlayerStatus = false;
                debug_dlm_output("VO_OSMP_CB_SEEK_COMPLETE\n");
            }
    
            else if(pMessage.indexOf("VO_OSMP_CB_STOP_COMPLETE")!=-1 )
            {
                // 影片按下停止結束.
                RetCode = '{"t":"stop","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + '}';
                RetCode += ',{"t":"end","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + '}';
                AnalyticsPlayerStatus = false;
                debug_dlm_output("VO_OSMP_CB_STOP_COMPLETE\n");
                debug_dlm_output("  pIsMute:"+pIsMute + "  pVolumeValue:"+pVolumeValue  + "  pTotalTime:"+pTotalTime  + "  pCurrentTime:"+pCurrentTime  + "  pPlaybackCompleted:"+pPlaybackCompleted   +"\n");
            }
    
            else if(pMessage.indexOf("VO_OSMP_CB_PLAY_COMPLETE")!=-1 )
            {
                // 影片撥放結束.
                RetCode = '{"t":"end","ts":' + UnixTimestampGet() + ',"ps":' + Math.ceil(pCurrentTime*1000) + '}';
                debug_dlm_output("VO_OSMP_CB_PLAY_COMPLETE\n");
            }
            else if(pMessage.indexOf("VO_OSMP_SRC_ADAPTIVE_STREAMING_INFO_EVENT_BITRATE_CHANGE")!=-1 )
            {
                if(newVideoBandwidth!=oldVideoBandwidth)
                {
                    oldVideoBandwidth = newVideoBandwidth;
                    RetCode = '{"t":"pbr","ts":' + UnixTimestampGet() + ',"br":' + newVideoBandwidth + '}';
                    debug_dlm_output("VO_OSMP_SRC_ADAPTIVE_STREAMING_INFO_EVENT_BITRATE_CHANGE   VideoBandwidth:" + newVideoBandwidth + "\n");
                }
            }





            else if(pMessage.indexOf("VO_OSMP_CB_PLAY_TIME_UPDATED")!=-1 )
            {
                debug_dlm_output("VO_OSMP_CB_PLAY_TIME_UPDATED\n");
            }
            else if(pMessage.indexOf("VO_OSMP_SRC_CB_PROGRAM_CHANGED")!=-1 )
            {
                debug_dlm_output("VO_OSMP_SRC_CB_PROGRAM_CHANGED\n");
            }
            else if(pMessage.indexOf("VO_LOG_SERVER_CONNECTED")!=-1 )
            {
                debug_dlm_output("VO_LOG_SERVER_CONNECTED\n");
            }
            else if(pMessage.indexOf("VO_LOG_SERVER_DISCONNECTED")!=-1 )
            {
                debug_dlm_output("VO_LOG_SERVER_DISCONNECTED\n");
            }
            else if(pMessage.indexOf("VO_OSMP_CB_LOG_ADDED")!=-1 )
            {
                debug_dlm_output("VO_OSMP_CB_LOG_ADDED\n");
            }
            else if(pMessage.indexOf("VO_OSMP_CB_ERROR_EVENTS")!=-1 )
            {
                debug_dlm_output("VO_OSMP_CB_ERROR_EVENTS\n");
            }
            else if(pMessage.indexOf("VO_OSMP_CB_PIP_MODE_CHANGED")!=-1 )
            {
                debug_dlm_output("VO_OSMP_CB_PIP_MODE_CHANGED\n");
            }
            else
            {
                debug_dlm_output(pMessage + "\n");
            }
        }
        else
        {
            // 將收到的資訊匯入變數中
            parseSystemLog(pMessage);
        }
    }

    AnalyticsSendToQueue(RetCode);
}


// 從voplayer.min.js傳回
// 處理方式
// 1.於觸發StartDownloadLog()後,在陣列中找一個空字串位置
// 2.將資料紀錄於該空字串中.格式 "UnixTimestampGet(),pStartTime,pUrl"
// 3.於觸發EndDownloadLog()後,尋找陣列中 pStartTime 相同資料.代表已經結束.並將該陣列中的字串清除
// 4.將資料輸出
var StartDownloadArrayRecord = new Array();
// pUrl:下載之影片trunk完整的URL
// pStartTime:下載之影片trunk撥放點開始時間
// pMediaType:下載之trunk格式內容."audio" / "video"
function StartDownloadLog(pUrl, pStartTime, pMediaType)
{
    var i;
    
    if(isNaN(pStartTime))
        return ;
    if(pMediaType.toString()!="video")
        return ;
    //debug_dlm_output( "aaaaaa ██ 開始記錄時間 Timestamp:" + UnixTimestampGet() + "  pStartTime:" + pStartTime + "  pMediaType:" + pMediaType  + "  pUrl:" + pUrl + "\n");
    
    for(i=0;i<3000;i++)
    {
        if(StartDownloadArrayRecord[i].length<10)
            break;
    }
    StartDownloadArrayRecord[i] = UnixTimestampGet() + "," + pStartTime + "," + pUrl;
}

// 從voplayer.min.js傳回.搭配 StartDownloadLog() 一起使用.處理下載完成動作
// pStartTime:下載之影片trunk撥放點開始時間
// pEndTime:下載之影片trunk撥放點結束時間
// pDuration:下載之影片trunk可以撥放的長度時間
// pBytes:下載之影片trunk所佔用位元組數量
// pMediaType:下載之trunk格式內容."audio" / "video"
function EndDownloadLog(pStartTime, pEndTime, pDuration, pBytes, pMediaType)
{
    var mStr;
    var UTG;
    var i;
    var s;
    
    UTG = UnixTimestampGet();
    if(pMediaType.toString()!="video")
        return ;

    //debug_dlm_output( "bbbbbb ██ 結束記錄時間 UTG:" + UTG + "   Timestamp:" + UnixTimestampGet() + "  pStartTime:" + pStartTime + "  pEndTime:" + pEndTime  + "  pDuration:" + pDuration  + "  pBytes:" + pBytes + "  pMediaType:" + pMediaType + "\n"); 
    
    for(i=0;i<3000;i++)
    {
        if(StartDownloadArrayRecord[i].indexOf("," + pStartTime + ",")>1)
        {
            s = StartDownloadArrayRecord[i].split(",")
            if(s.length==3)
            {
                var ms = UTG - parseFloat(s[0]);
                var RetCode = '{"t":"segdle","ts":' + UTG + ',"uri":"' + s[2] + '","sz":' + pBytes + ',"td":' + ms + '}';
                //console.log( "██pBytes:" + pBytes + "   ms:" + ms + "  下載速率bit:" + Math.floor((pBytes*8*1000)/ms) + "   Bytes:" + Math.floor((pBytes*1000)/ms) + "\n"); 
                AnalyticsSendToQueue(RetCode);
                
                // 求出下載每秒 bitrate
                var bitrate = Math.floor((pBytes*8)/ms)*1000;
                if(newVideoBandwidth>bitrate)
                {
                    if(BINC_var==false)
                        setTimeout("BufferInsufficientNotifyCallback(" + newVideoBandwidth + "," +  bitrate+ ")", 5);
                    //BufferInsufficientNotify(newVideoBandwidth, bitrate);
                }
            }
            StartDownloadArrayRecord[i] = "";
        }
    }
}


var BINC_var=false; // 是否引發 BufferInsufficientNotify 處理中.
function BufferInsufficientNotifyCallback(SelectBitrate, DownloadBitrate)
{
    if(BINC_var)
        return;
    BINC_var = true;
    BufferInsufficientNotify(SelectBitrate, DownloadBitrate);
    BINC_var = false;
}


// 從voplayer.min.js傳回目前撥放之影片頻寬.
// pMediaType:資料型態
// pBandwidth:頻寬位元速率
function VideoBandwidthGet(pMediaType, pBandwidth)
{
    try
    {
        if(pMediaType=="video")
        {
            newVideoBandwidth = pBandwidth;
// debug_dlm_output( "██ VideoBandwidthGet  pMediaType:" + pMediaType + "  pBandwidth:" + pBandwidth+"\n"); 
        }
    }
    catch (e)
    {
    }
    
    return "";
}



// 接收來自於系統 log 資訊文字
// pData:系統 log 內容文字 , 若接收到 "__Clear_All_Array_Data__" 則為影片即將準備開始撥放通知.
function parseSystemLog(pData)
{
    // pData 若設定為 "__Clear_All_Array_Data__" 則清除所有下載暫存紀錄資料
    if(pData.indexOf("__Clear_All_Array_Data__")!=-1)
    {
        for (var i=0;i<3000;i++)
        {
            StartDownloadArrayRecord[i] = "";
        }
    }

    // 先移除不需要分析的資訊
    if(pData.indexOf("Buffer level:")!=-1)
        return;
    if(pData.indexOf("Check buffer sufficient level")!=-1)
        return;

}



// 從voplayer.min.js傳回
// 若撥放器發生掉頁狀態時,則觸發此通知函數
// pCount:掉頁數量
var OldDropFrameTime=-1;    // 紀錄目前撥放之影片掉頁數量
function DropFrameNotify(pCount)
{
    var NowDropFrameTime=0;
    
    // frame drop
    // 目前播放之檔案,於傳送到分系伺服器之區間時間.所產生之所有 dropped frame數量數量
    // 1frame
    // ex:{"did":"LozQFD33j+mDxZ4AFgHX8U2k/4E=","sid":1503453423119,"t":"frdrp","ts":1503453532389,"ps":253001}

    NowDropFrameTime = Math.floor(mCurrentTime*1000);
    if(OldDropFrameTime!=NowDropFrameTime)
    {
        DropFrameCount += pCount;
        OldDropFrameTime=NowDropFrameTime;
        var RetCode = '{"t":"frdrp","ts":' + UnixTimestampGet() + ',"ps":' + NowDropFrameTime + '}';
        AnalyticsSendToQueue(RetCode);
debug_dlm_output( "███ DropFrameNotify█" + RetCode + "\n");
debug_dlm_output( "███ DropFrameCount█" + DropFrameCount + "\n");
    }
}



// 從voplayer.min.js傳回
// 當影片要準備開始撥放前.會先取得 .MPD 檔案內容.
// 透過 voplayer.min.js 回傳一份讓 parseVideoResponseframeRateGet() 分析 frame rate 與 live/vod 內容
function parseVideoResponseframeRateGet(pResponse)
{
    var mStr;
    var i=-1;
    var s;
    var mData;
    
    
    // 分析 FPS 資訊,若已經分析過.則直接離開
    if(VideoFrameRate>10)
        return;
    
    mStr = pResponse.toUpperCase() + "                                 ";
    
    // analytics frame rate
    try
    {
        i = mStr.indexOf("FRAMERATE");
    }
    catch (e)
    {
        i=-1;
    }
    
    if (i<10)
    {
        return ;
    }
    // frameRate="30" segmentAlignmen
    // frameRate="30000/1001" segment
    // frameRate="24" sar="1:1">
    mData = mStr.substring(i, i+30);
    
    s = mData.split('"');
    if (s.length<3)
        return;

    mData = s[1].trim();
    try
    {
        if(mData.length==2)
        {
            VideoFrameRate = parseFloat(mData);
        }
        else
        {
            if(mData.indexOf("/")>1)
            {
                s = mData.split('/');
                
                try
                {
                    i = parseFloat(s[0]) / parseFloat(s[1]);
                }
                catch (e)
                {
                    i=-1;
                }
                if(i>20 && i<66)
                    VideoFrameRate = i;
            }
        }
    }
    catch (e)
    {
        VideoFrameRate=30;
    }
    
    VideoFrameRate = parseFloat(Math.floor(VideoFrameRate*1000)/1000);
    // streaming fps    30/24/29.97
    // 每秒 之 FPS
    // ex:{"did":"LozQFD33j+mDxZ4AFgHX8U2k/4E=","sid":1503453423119,"t":"sfr","ts":1503453429317,"fps":29.980000}
debug_dlm_output( "█VideoFrameRate█" + VideoFrameRate + "\n");
    
    
    
    // ========================================================
    // analytics live/vod
    // 影片源是否為 VOD, videoSourceLiveOrVOD="VOD"時代表為 VOD影片, videoSourceLiveOrVOD="LIVE"時代表為 live影片
    mData="";
    mStr = pResponse.toUpperCase() + "                                 ";//'<AdaptationSet id="0" group="1" mimeType="video/mp4" width="1280" height="720" par="16:9" frameRate="30000/1001" segmentAlignment="true" startWithSAP="1" subsegmentAlignment="true" subsegmentStartsWithSAP="1">';
    try
    {
        i=mStr.indexOf(" TYPE");
        if(i>0)
        {
            mData = mStr.substring(i, i+30);
        }
        else
        {
            i=mStr.indexOf("\nTYPE");
            if(i>0)
            {
                mData = mStr.substring(i, i+30);
            }
            else
            {
                i=mStr.indexOf("\tTYPE");
                if(i>0)
                {
                    mData = mStr.substring(i, i+30);
                }
            }
        }
    }
    catch (e)
    {
        i=-1;
    }

    if(i<10)
        return;
    
    
    if(mData.indexOf("STATIC")>1)
    {
        videoSourceLiveOrVOD = "VOD";
    }
    else if(mData.indexOf("DYNAMIC")>1)
    {
        videoSourceLiveOrVOD = "LIVE";
    }
    // 2.1.14  Video Type 
    // video type : live or vod
    //  type="dynamic"live / type="static"vod
    // ex:{"did":"LozQFD33j+mDxZ4AFgHX8U2k/4E=","sid":1503453423119,"t":"vt","ts":1503453532389,"fmt":"LIVE"}

debug_dlm_output( "█videoSourceLiveOrVOD█" + videoSourceLiveOrVOD + "\n");
}



// 從voplayer.min.js傳回
// 接收目前預備撥放的緩衝區中,還存留多少時間秒數暫存
// MediaType:緩衝區內的媒體型態 "audio" / "video"
// pSecond:尚存留多少秒數
function BufferTimeSeconds(MediaType, pSecond)
{
    if(MediaType=="video")
        console.log("█BufferTimeSeconds MediaType:" + MediaType + "   pSecond:" + pSecond + "\n");
}


// 公用副程式
// 在字串中,取回鍵值之後的文字
// getSubstring("1234567890", "3") = "4567890"
// getSubstring("1234567890", "3", "6") = "45"
function getSubstring(pData, pKeyStart, pKeyEnd="")
{
    var v=pData.indexOf(pKeyStart);
    var mStr;
    if(v!=-1)
    {
        mStr = pData.substring(v+pKeyStart.length);
        if(pKeyEnd.length>0)
        {
            v = mStr.indexOf(pKeyEnd);
            if(v!=-1)
            {
                mStr = mStr.substring(0,v);
            }
        }
        return mStr;
    }
    else
        return "";
}


