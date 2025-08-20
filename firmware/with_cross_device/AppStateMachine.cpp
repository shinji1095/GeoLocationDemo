#include "AppStateMachine.h"
#include <WiFi.h>
#include "NetDebug.h"
#include <esp_wifi.h>

/* ===== 初期化 ======================================================== */
void AppStateMachine::begin() {
    initHardware();
    buttons.begin(kBtnPins, 4); 
    LOGI("FSM","begin()");

    /* BLE 受信 → Wi-Fi creds を取得したら WS_WAIT へ */
    ble.begin([this](const BleAgent::Creds& c) {
        wifiCreds = c;
        LOGI("FSM","BLE creds received: ssid=%s ip=%s port=%u",
             c.ssid.c_str(), c.ip.c_str(), c.port);
        to(S::WS_WAIT);
    });

    bool ok = cam.begin();
    LOGI("FSM","camera init=%d", ok);
}

/* ===== メインループ =================================================== */
void AppStateMachine::loop() {
    if(btnActivate) {
        buttons.update();
        buttonTask();
    }
    ledTask();
    if (bleActive) ble.loop();
    ws.loop();

    switch (st) {
    /* ---------- WebSocket 接続待機 ---------------------- */
    case S::WS_WAIT: {
        /* Wi-Fi まだなら開始 */
        if (!wifiStarted && wifiCreds.ssid.length()) {
            LOGI("WiFi","begin SSID=%s", wifiCreds.ssid.c_str());
            WiFi.mode(WIFI_STA);               // ステーションモード
            WiFi.setSleep(false);              // Arduino-ESP32 側の省電力 OFF
            esp_wifi_set_ps(WIFI_PS_NONE);     // IDF レベルの省電力 OFF
            WiFi.begin(wifiCreds.ssid.c_str(), wifiCreds.psk.c_str());
            wifiStarted = true;
        }

        /* WS 接続試行 */
        if (wifiStarted && WiFi.status() == WL_CONNECTED && !ws.ready()) {
            if (ws.begin(wifiCreds.ip.c_str(), wifiCreds.port)) {
                LOGI("WS","ws.begin(%s:%u)",
                     wifiCreds.ip.c_str(), wifiCreds.port);

                /* 一度だけ BLE を停止 */
                static bool bleStopped = false;
                if (!bleStopped) {
                    ble.stop();
                    bleActive  = false;
                    bleStopped = true;
                    LOGI("BLE","Stopped after Wi-Fi up");
                }
            }
        }

        /* ready になった瞬間 HOME へ */
        if (ws.ready() && st == S::WS_WAIT) {
            LOGI("WS","CONNECTED → HOME");
            btnActivate = true;
            to(S::HOME);
        }
    } break;

    /* ---------- 実行モード中：画像ストリーム ------------ */
    case S::SIG:
    case S::STRAIGHT:
    case S::OBJ: {
        uint64_t t0 = esp_timer_get_time();
        cam.stream(ws);
        // LOGD("CAM","stream() %llu us",
        //      (unsigned long long)(esp_timer_get_time() - t0));
    } break;

    default: break;
    }
}

/* ===== 状態遷移 ====================================================== */
void AppStateMachine::to(S n) {
    LOGI("FSM","%s → %s", toStr(st), toStr(n));
    st = n;

    switch (st) {
        case S::BLE_WAIT:  ledInt = 500;                           break;
        case S::GET_INFO:  ledInt = 200;                           break;
        case S::WS_WAIT:   ledInt = 100; wifiStarted = false;      break;

        case S::HOME:      ledInt = 0;     ws.sendMode(mode);      break;
        case S::SIG:       ws.sendMode(0x1001);                    break;
        case S::STRAIGHT:  ws.sendMode(0x1010);                    break;
        case S::OBJ:       ws.sendMode(0x1011);                    break;
    }
}

/* ===== LED 点滅 ====================================================== */
void AppStateMachine::ledTask() {
    if (!ledInt) { digitalWrite(LED_PIN, LOW); return; }
    if (millis() - tLed >= ledInt) {
        ledOn = !ledOn;
        digitalWrite(LED_PIN, ledOn);
        tLed = millis();
    }
}

/* ===== ボタンハンドラ =============================================== */
void AppStateMachine::buttonTask() {
    /* --------- HOME でのモード選択 -------------------------------- */
    if(st == S::HOME){
        if(buttons.rising(BTN_NEXT)){
            modeIdx = (modeIdx + 1) % MODE_CNT;
            mode    = kModes[modeIdx];
            ws.sendMode(mode);
        }
        if(buttons.rising(BTN_PREV)){
            modeIdx = (modeIdx + MODE_CNT - 1) % MODE_CNT;
            mode    = kModes[modeIdx];
            ws.sendMode(mode);
        }

        if(buttons.rising(BTN_OK)){
            switch(modeIdx){
                case 0: to(S::SIG);       break;
                case 1: to(S::STRAIGHT);  break;
                case 2: to(S::OBJ);       break;
            }
        }

    /* ------ 実行中：BACK で HOME ------ */
    }else if(buttons.rising(BTN_BACK)){
        to(S::HOME);
        ws.sendMode(0x1000);
    }

    else if (st == S::SIG || st == S::STRAIGHT || st == S::OBJ)
    {
        if (buttons.rising(BTN_BACK)) {
            ws.sendMode(0x1000);
            to(S::HOME);                              // ← 戻り
            return;
        }

        /* 押下中処理 ------------------------------------ */
        if (buttons.pressed(BTN_OK)) {
            if(!okHolding){                           // 押し始め
                okPressStart = millis();
                okHolding = true;
            }
        }
        /* リリース検出 (HIGH→LOW) ----------------------- */
        else if (okHolding) {                         // 離した瞬間
            uint32_t held = millis() - okPressStart;
            okHolding = false;
            if (held >= LONG_MS) {
                LOGI("BTN","OK long %ums → HOME", held);
                ws.sendMode(0x1111);
                to(S::HOME);
            }
        }
    }
}
