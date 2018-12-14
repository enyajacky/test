
// 使用方式
//    userAgent:<div id="userAgent">userAgent</div><br>
//    plateform:<div id="plateform">plateform</div><br>
//    Model:<div id="Model">Model</div><br>
//    OS:<div id="OS">OS</div><br>
//
//    var mUserAgent=navigator.userAgent;
//    document.getElementById("userAgent").innerHTML = mUserAgent;
//    document.getElementById("plateform").innerHTML = userAgentPlateformGet(mUserAgent);
//    document.getElementById("OS").innerHTML = userAgentOSGet(mUserAgent);
//    document.getElementById("Model").innerHTML = userAgentModelGet(mUserAgent);
//


// 取回方式規則.網頁瀏覽器.Mobile Web/ PC Web/MAC Web/ Linux Web
//
function userAgentPlateformGet(pUserAgent)
{
    // Windows NT
    // Windows Phone
    // Android
    // Macintosh
    // iPhone
    // iPad
    // BB10
    // Linux    要放最後面,和android 衝突
    var Keywords="Windows NT,Windows Phone,Android,Macintosh,iPhone,iPad,BB10,Linux";
    Keywords = Keywords.replace(/ /g,"");
    Keywords = Keywords.split(",");

    // WindowsNT Web
    // WindowsPhone Web
    // Android Web
    // Macintosh Web
    // iPhone Web
    // iPad Web
    // BlackBerryPhone Web
    // Linux Web    要放最後面,和android 衝突
    var OsName="WindowsNT Web,WindowsPhone Web,Android Web,Macintosh Web,iPhone Web,iPad Web,BlackBerryPhone Web,Linux Web".split(",");
    var mUserAgent=pUserAgent.replace(/ /g,"");
    var i;
    for(i=0;i<Keywords.length;i++)
    {
        if(mUserAgent.indexOf(Keywords[i]) != -1)
            return OsName[i];
    }
    return "unknown";
}



// 取回關鍵字與後面數值
// ex:
// pSource="(KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
// pKeyword="Chrome"
// return "Chrome/56.0.2924.87"
// 若找不到時.傳回 pKeyword
function AndroidVerKeywordGet(pSource, pKeyword)
{
    // 非 IE 需要另外取回版本
    var postion=pSource.indexOf(pKeyword);
    //alert(pKeyword +":" + postion);
    var mStrLen="";
    var mStr="";
    if (postion!=-1)
    {
        mStr = pSource.substr(postion);
        mStrLen = pSource.substr(postion+pKeyword.length);
        postion=mStrLen.indexOf(" ");
        if (postion!=-1)
        {
            // 存在空白
            mStr = mStr.substr(0,postion+pKeyword.length);
        }
        return mStr.replace("/"," ");       // 將所有的 '/' 轉換成空白字元 ' '
    }
    return pKeyword;
}

// 取回關鍵字與後面數值
// ex:
// pSource="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/602.4.8"
// pKeyword="Macintosh"
// return "Macintosh; Intel Mac OS X 10_12_3"
// 若找不到時.傳回 pKeyword
function MacintoshVerKeywordGet(pSource, pKeyword)
{
    // 非 IE 需要另外取回版本
    var postion=pSource.indexOf(pKeyword);
    //alert(pKeyword +":" + postion);
    var mStr="";
    if (postion!=-1)
    {
        mStr = pSource.substr(postion);
        postion=mStr.indexOf(")");
        if (postion!=-1)
        {
            // 存在空白
            mStr = mStr.substr(0,postion);
        }
        return mStr;//.replace("/"," ");       // 將所有的 '/' 轉換成空白字元 ' '
    }
    return pKeyword;
}

// 取回作業系統名稱
// Windows XP
// 呼叫範例:alert(userAgentOSGet(navigator.userAgent));
function userAgentOSGet(pUserAgent)
{
    // Windows NT 4.0
    // Windows NT 5.0
    // Windows NT 5.1
    // Windows NT 5.2
    // Windows NT 6.0
    // Windows NT 6.1
    // Windows NT 6.2
    // Windows NT 6.3
    // Windows NT 10.0
    // Windows Phone
    // Android
    // Macintosh
    // iPhone
    // iPad
    // BB10
    // Linux    要放最後面,和android 衝突
    var Keywords="Windows NT 4.0,Windows NT 5.0,Windows NT 5.1,Windows NT 5.2,Windows NT 6.0,Windows NT 6.1,Windows NT 6.2,Windows NT 6.3,Windows NT 10.0,Windows Phone,Android,Macintosh,iPhone,iPad,BB10,Linux";
    Keywords = Keywords.replace(/ /g,"");
    Keywords = Keywords.split(",");


    // Windows 4.0
    // Windows 2000
    // Windows XP
    // Windows Server 2003
    // Windows Vista
    // Windows 7
    // Windows 8
    // Windows 8.1
    // Windows 10
    // Windows Phone
    // Android
    // Macintosh
    // iPhone
    // iPad
    // BlackBerry
    // Linux    要放最後面,和android 衝突
    var OsName="Windows 4.0,Windows 2000,Windows XP,Windows Server 2003,Windows Vista,Windows 7,Windows 8,Windows 8.1,Windows 10,Windows Phone,Android,Macintosh,iPhone,iPad,BlackBerry,Linux".split(",");
    var mUserAgent=pUserAgent.replace(/ /g,"");
    var i;
    var retStr="unknown";
    for(i=0;i<Keywords.length;i++)
    {
        if(mUserAgent.indexOf(Keywords[i]) != -1)
        {
            retStr = OsName[i];
            break;
        }
    }

    // 處理 Android 版本
    if(retStr.indexOf("Android") != -1)
    {
        retStr += " ";
        retStr = AndroidVerKeywordGet(pUserAgent, retStr);
    }

    if(retStr.indexOf("Macintosh") != -1)
    {
        retStr = MacintoshVerKeywordGet(pUserAgent, retStr);
    }
    return retStr;
}

// 取回關鍵字與後面數值
// ex:
// pSource="(KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
// pKeyword="Chrome"
// return "Chrome/56.0.2924.87"
// 若找不到時.傳回 pKeyword
function KeywordGet(pSource, pKeyword)
{
    // 非 IE 需要另外取回版本
    var postion=pSource.indexOf(pKeyword);
    //alert(pKeyword +":" + postion);
    var mStr="";
    if (postion!=-1)
    {
        mStr = pSource.substr(postion);
        postion=mStr.indexOf(" ");
        if (postion!=-1)
        {
            // 存在空白
            mStr = mStr.substr(0,postion);
        }
        return mStr.replace("/"," ");       // 將所有的 '/' 轉換成空白字元 ' '
    }
    return pKeyword;
}


// 網頁瀏覽器.取回瀏覽器名稱與版本
// userAgentModelGet(navigator.userAgent);
function userAgentModelGet(pUserAgent)
{
    // OPR/
    // Edge
    // Chrome
    // CriOS
    // Safari
    // Firefox
    // Windows NT 10.  由於Windows10-IE 會顯示為 MSIE 7 所以特別修正
    // MSIE 6.
    // MSIE 7.
    // MSIE 8.
    // MSIE 9.0
    // MSIE 10.
    // rv:11
    var Keywords="OPR/,Edge,Chrome,CriOS,Safari,CriOS,Firefox,Windows NT 10.,MSIE 6.,MSIE 7.,MSIE 8.,MSIE 9.0,MSIE 10.,rv:11";
    Keywords = Keywords.replace(/ /g,"");
    Keywords = Keywords.split(",");



    // OPR/
    // Edge
    // Chrome
    // Chrome
    // Safari
    // Firefox
    // MSIE 11  由於Windows10-IE 會顯示為 MSIE 7 所以特別修正
    // MSIE 6
    // MSIE 7
    // MSIE 8
    // MSIE 9
    // MSIE 10
    // MSIE 11
    var BrowserName="OPR/,Edge,Chrome,Chrome,Safari,Firefox,Firefox,MSIE 11,MSIE 6,MSIE 7,MSIE 8,MSIE 9,MSIE 10,MSIE 11".split(",");
    var mUserAgent=pUserAgent.replace(/ /g,"");
    var i;
    var retStr="unknown";
    for(i=0;i<Keywords.length;i++)
    {
        if(mUserAgent.indexOf(Keywords[i]) != -1)
        {
            retStr = BrowserName[i];
            break;
        }
    }
    if(retStr.indexOf("MSIE") != -1)
    {
        return retStr;
    }
    // 非 IE 需要另外取回版本
    retStr = KeywordGet(pUserAgent, retStr);
    // 針對 Opera 處理
    if(retStr.indexOf("OPR ") != -1)
    {
        retStr = retStr.replace("OPR ","Opera ");
    }
    return retStr;
}