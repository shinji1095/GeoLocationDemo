export const config = {
    MODEL_WIDTH: 640,
    MODEL_HEIGHT: 480,
    TFLITE_MODEL_PATH: '/model/WithCross_640x640.tflite',
    SSD_MODEL_PATH: "/model/ssdlite_mobilenet_v2_coco_300_integer_quant_with_postprocess.tflite"
  };

export const SIGNAL_LABEL = ['red', 'green', 'none'];
export const CROSSWALK_LABEL = ['crossing', 'not_crossing', 'approching'];