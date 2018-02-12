#include <memory>
#include <iostream>
#include <vector>



extern "C" {
  EMSCRIPTEN_KEEPALIVE
  float* getExponentiallySmoothedData (float *buf, int nTime) {
    std::cout << "nTime: " << nTime << std::endl;
    int z = 0;
    std::vector<float> timedData(nTime*2);
    for (int i=0;i<nTime;i++) {
      timedData[i*2] = buf[z++];
      timedData[i*2+1] = buf[z++];
    }

    int nPoints = nTime;
    double ALPHA = 0.01;
    int ALPHAcutoff = 458; // round(log(0.01)/(log(1-ALPHA)));
    std::vector<double> expDen(458);
    std::vector<double> expVals(458);

    expDen[0] = 1;
    expVals[0] = 1;
    std::cout << "ALPHACUTOFF: " << ALPHAcutoff ;
    for (int i=1;i<=ALPHAcutoff;i++) {
      double newWeight = expVals[i-1]*(1-ALPHA);
      expVals[i] = newWeight;
      expDen[i] = expDen[i-1]+newWeight;
      std::cout << "[" << i << ":" << newWeight << "," << expVals[i] << "," << expDen[i] << "]";
    }
    std::cout << std::endl;


    int n = 0;
    std::vector<float> smoothedY(nPoints-2);
    for (int x=1;x<nPoints;x++) {
      double num = timedData[x*2+1];
      double den = expDen[ALPHAcutoff < x ? ALPHAcutoff : x];
      int expo = 1;
      for (int y=x-1;y>-1;y--) {
        num += double(timedData[y*2+1]*expVals[expo]);
        expo += 1;
        if (expo >= ALPHAcutoff) {
          break;
        }
      }
      if (x==1) {
        continue;
      }
      float res = float(num/den);
      smoothedY[x-2] = res;
      std::cout << "[" << num << "/" << den << "(" << smoothedY[x-2] << ")] ";
    }
    // std::cout << std::endl;


    // float returnees[(nPoints-2)*2+1]; // DON'T DO THIS!!!
    // float *returnees = (float*) std::malloc(sizeof(*returnees));
    // std::vector<float> returnees((nPoints-2)*2+1);

    std::cout << "FINISHED WITH returnees alloc" << std::endl;
    if (nPoints < 500) {
      std::cout << "TDATA SIZE: " << timedData.size() << "|nPoint: " << nPoints << "|smoothedY size: " << smoothedY.size();
      int r = 0;
      buf[r++] = nPoints-2;
      for (int i=0;i<nPoints-2;i++) {
        buf[r++] = timedData[i*2+4];
        buf[r++] = smoothedY[i];
        //std::cout << "[" << i << ":" << timedData[i*2+4] << "," << smoothedY[i] << ']';
      }
    } else {
      // just average nearby points together
      float binSize = (nPoints-2)/500;
      int r = 0;
      int p = 0;
      int c = 0;
      double totX = 0;
      double totY = 0;
      float prevX = timedData[p*2+4];
      while (p<nPoints-2) {
        float x = timedData[p*2+4];
        float y = smoothedY[p];
        if (p/binSize > r && x - prevX > 0.001) {
          prevX = x;
          float xResult = float(totX/c);
          float yResult = float(totY/c);
          buf[r*2+1] = xResult;
          buf[r*2+2] = yResult;
          std::cout << "[XRESULT:" << xResult << "|YRESULT:" << yResult << "]";
          r++;
          totX = 0;
          totY = 0;
          c = 0;
        }
        totX += x;
        totY += y;
        p++;
        c++;
        std::cout << "[p:" << p << "|c:" << c << "|x:" << x << "|y:" << y << "|totX:" << totX << "|totY:" << totY << "] ";
      }
      buf[r*2+1] = float(totX/c);
      buf[r*2+2] = float(totY/c);
      buf[0] = r;
    }
    std::cout << "FINISHED WITH returnees" << std::endl;
    // std::cout << std::endl;
    for (int i=0;i<(nPoints-2)*2+1;i++) {
      std::cout << "[" << i << ":" << buf[i] << ']';
    }
    std::cout << "FINISHED WITH pointer: " << (uintptr_t)&buf[0]/4 << std::endl;
    return buf;
  }
}
