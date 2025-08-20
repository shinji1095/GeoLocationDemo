#pragma once
#include <Arduino.h>

#include "WsAgent.h"
#include "esp_camera.h"
#define CAMERA_MODEL_XIAO_ESP32S3
#include "camera_pins.h"

class CameraStreamer {
public:
    bool begin();      
    void stream(WsAgent& ws);                 
private:
    uint32_t _interval = 100;
    uint32_t _tLast = 0;
    uint32_t _nextOkAfter  = 0;
    void initCameraConfig(camera_config_t&);
};
