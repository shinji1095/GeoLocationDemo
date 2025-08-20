#pragma once
#include "BleAgent.h"
#include "WsAgent.h"
#include "CameraStreamer.h"
#include "Hardware.h"
#include "Buttons.h" 

class AppStateMachine {
public:
    static AppStateMachine& instance() {
        static AppStateMachine inst;
        return inst;
    }
    void begin();
    void loop();

private:
    /* ── 状態定義 ─────────────────────────────────────────────── */
    enum class S : uint8_t { BLE_WAIT, GET_INFO, WS_WAIT, HOME,
                             SIG, STRAIGHT, OBJ };

    /* ── モード循環テーブル ─────────────────────────────────── */
    static constexpr uint8_t  MODE_CNT = 3;
    static constexpr uint16_t kModes[MODE_CNT] = { 0x0001, 0x0010, 0x0011 };

    Buttons  buttons;
    static constexpr uint8_t kBtnPins[4] = { BTN_PREV, BTN_NEXT, BTN_BACK, BTN_OK };

    /* ── 変数 ──────────────────────────────────────────────── */
    S         st       = S::BLE_WAIT;
    uint8_t   modeIdx  = 0;              // 0-based index
    uint16_t  mode     = kModes[0];      // 現在選択中
    BleAgent  ble;
    WsAgent   ws;
    CameraStreamer cam;

    BleAgent::Creds wifiCreds;
    bool     wifiStarted = false;
    bool     bleActive   = true;
    bool     btnActivate = false;

    uint32_t tFrame = 0;                 // frame interval for camera
    uint32_t tLed   = 0; bool ledOn = false; uint16_t ledInt = 500;

    uint32_t  okPressStart = 0;
    bool      okHolding    = false;
    static constexpr uint32_t LONG_MS = 500;



    /* ── helpers ───────────────────────────────────────────── */
    const char* toStr(S s) const {
        switch (s){
            case S::BLE_WAIT:  return "BLE_WAIT";
            case S::GET_INFO:  return "GET_INFO";
            case S::WS_WAIT:   return "WS_WAIT";
            case S::HOME:      return "HOME";
            case S::SIG:       return "SIG";
            case S::STRAIGHT:  return "STRAIGHT";
            case S::OBJ:       return "OBJ";
        } return "?";
    }

    /* ── task & state control ──────────────────────────────── */
    void to(S n);
    void ledTask();
    void buttonTask();
};
