export const config = {
    MODEL_WIDTH: 640,
    MODEL_HEIGHT: 640,
    TFLITE_MODEL_PATH: '/WithCross_640x640.tflite',
    SSD_MODEL_PATH: "/ssdlite_mobilenet_v2_coco_300_integer_quant_with_postprocess.tflite"
  };

export const SIGNAL_LABEL = ['red', 'green', 'none'];
export const CROSSWALK_LABEL = ['crossing', 'not_crossing', 'approching'];