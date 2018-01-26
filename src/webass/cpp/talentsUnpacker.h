#include <math.h>
#include <memory>
#include <iostream>
#include <vector>



void printBuild(int build[]) {
    for (int t=0;t<7;t++) {
      std::cout << "[ " << build[t] << " ]";
    }
    std::cout << std::endl;
}

void printBuildKeyDic(std::vector< std::vector< std::vector<int> > > BKD) {
  for (int l=0;l<BKD.size();l++) {
    std::cout << "Level " << l << ", length: " << BKD[l].size() << std::endl;
    for (int t=0;t<BKD[l].size();t++) {
      std::cout << "Talent " << t << ", length: " << BKD[l][t].size() << std::endl;
      for (int b=0;b<BKD[l][t].size();b++) {
        std::cout << "[ " << BKD[l][t][b] << " ]";
      }
      std::cout << std::endl;
    }
  }
}

void printTwoDeep(std::vector< std::vector<int> > BKD) {
  for (int l=0;l<BKD.size();l++) {
    std::cout << "Level " << l << std::endl;
    for (int t=0;t<BKD[l].size();t++) {
      std::cout << "Talent " << t << ": " << BKD[l][t] << std::endl;
    }
  }
}


uint32_t * sortTalents (int partialBuilds[][9], int fullBuilds[][11], int nPartial, int nFull, std::vector< std::vector<int> > realTalents, int nTalents) {

  std::vector< std::vector< std::vector<int> > > buildKeyDic;
  std::vector< std::vector< std::vector<int> > > talentResults;

  buildKeyDic.reserve(14*nFull);
  for (int l=0;l<7;l++) {
    std::vector< std::vector<int> > levKeys;
    std::vector< std::vector<int> > levKeys2;
    buildKeyDic.push_back(levKeys);
    talentResults.push_back(levKeys2);
    for (int t=0;t<realTalents[l].size();t++) {
      std::vector<int> talKeys;
      std::vector<int> talRes { 0, 0, 0, 0, 0, 0};
      buildKeyDic[l].push_back(talKeys);
      talentResults[l].push_back(talRes);
    }
  }

  for (int b=0;b<nFull;b++) {
    for (int l=0;l<7;l++) {
      for (int t=0;t<realTalents[l].size();t++) {
        if (realTalents[l][t] == fullBuilds[b][l]) {
          buildKeyDic[l][t].push_back(b);
          for (int type=1;type<3;type++) {
            talentResults[l][t][type*2] +=  fullBuilds[b][7];
            talentResults[l][t][type*2+1] +=  fullBuilds[b][8];
          }
          break;
        }
      }
    }
  }

  // printBuildKeyDic(buildKeyDic);


  std::vector< std::vector<int> > partialMatches;
  std::vector<int> partialCounts;
  for (int p=0;p<nPartial;p++) {
    int indexKey;
    for (int t=0;t<realTalents[0].size();t++) {
      // std::cout << "[" << t << ":" << partialBuilds[p][0] << "]";
      if (partialBuilds[p][0] == realTalents[0][t]) {
        indexKey = t;
      }
    }
    // std::cout << "**** INDEX KEY ***** (" << indexKey << ")" << std::endl;
    std::vector<int> potentialMatches = buildKeyDic[0][indexKey];
    for (int l=0;l<7;l++) {
      int bKey = partialBuilds[p][l];
      if (bKey==0) {
        break;
      }
      for (int t=0;t<realTalents[l].size();t++) {
        if (realTalents[l][t] == bKey) {
          talentResults[l][t][2] += partialBuilds[p][7];
          talentResults[l][t][3] += partialBuilds[p][8];
          break;
        }
      }
      /*
      if (l==0) {
        // first level is only for assigning partials above
        continue;
      }
      */
      std::vector<int> potMatches;
      int nPots = potentialMatches.size();
      for (int m=0;m<nPots;m++) {
        int fIndex = potentialMatches[m];
        if (fullBuilds[fIndex][l] == bKey) {
          potMatches.push_back(fIndex);
        }
      }
      potentialMatches = potMatches;
    }
    int total = 0;
    int nPots = potentialMatches.size();
    for (int m=0;m<nPots;m++) {
      total += fullBuilds[potentialMatches[m]][8];
    }
    partialMatches.push_back(potentialMatches);
    partialCounts.push_back(total);
  }
  // std::cout << nPartial << "N PARTIAL" << std::endl;
  for (int p=0;p<nPartial;p++) {
    int total = partialCounts[p];
    float wins = partialBuilds[p][7];
    float count = partialBuilds[p][8];
    std::vector<int> potMatches = partialMatches[p];
    int nPots = potMatches.size();
    // std::cout << "p:" << p << ":" << nPots << "[" << wins << "|" << count << "]";
    for (int m=0;m<nPots;m++) {
      int bKey = potMatches[m];
      float percent = 1.0*fullBuilds[bKey][8]/total;
      // std::cout << "[bKey:" << bKey << "] ";
      /*
      for (int q=0;q<11;q++) {
        std::cout << "[" << fullBuilds[bKey][q] << "]";
      }
      std::cout << std::endl;
      */
      // std::cout << " PERCENT: " << percent;
      fullBuilds[bKey][9] += int(1000*wins*percent);
      fullBuilds[bKey][10] += int(1000*count*percent);

    }

  }

  for (int b=0;b<nFull;b++) {
    for (int l=0;l<7;l++) {
      for (int t=0;t<realTalents[l].size();t++) {
        if (realTalents[l][t] == fullBuilds[b][l]) {
          talentResults[l][t][0] += fullBuilds[b][9];
          talentResults[l][t][1] += fullBuilds[b][10];

          break;
        }
      }
    }
  }

  // printBuildKeyDic(talentResults);
  // printTwoDeep(realTalents);
  // printBuildKeyDic(buildKeyDic);

  uint32_t returneeBuilds [nFull*11+nPartial*9+nTalents*7+7];
  int o = 0;

  returneeBuilds[o++] = nTalents;
  returneeBuilds[o++] = nFull;
  returneeBuilds[o++] = nPartial;

  // Talent counts
  for (int l=0;l<7;l++) {
    returneeBuilds[o++] = realTalents[l].size();
  }

  // Talents first
  for (int l=0;l<7;l++) {
    for (int t=0;t<realTalents[l].size();t++) {
      returneeBuilds[o++] = realTalents[l][t];
      for (int n=0;n<6;n++) {
        returneeBuilds[o++] = talentResults[l][t][n];
      }
    }
  }

  // Then full builds
  for (int b=0;b<nFull;b++) {
    /* std::cout << "[Build:" << b << "]:::";
    for (int q=0;q<11;q++) {
      std::cout << "[" << fullBuilds[b][q] << "]";
    }
    std::cout << std::endl;
    */
    for (int k=0;k<11;k++) {
      returneeBuilds[o++] = fullBuilds[b][k];
    }
  }
  // Then partial builds
  for (int b=0;b<nPartial;b++) {
    for (int k=0;k<9;k++) {
      returneeBuilds[o++] = partialBuilds[b][k];
    }
  }

  auto arrayPtr = &returneeBuilds[0];
  return arrayPtr;
}

extern "C" {


  EMSCRIPTEN_KEEPALIVE
  uint32_t * decodeTalents (
    int32_t *buf,
    int nBuilds
  ) {
    /* Takes in the files you generated for all builds server side and deconstructs them into all full and partial builds.  After sending this to the function sortTalents, returns full unselected talent wins / losses for various categories as well as the original partial builds info and the modified (partial build incorporated) full builds. */
    int z = 0;
    int levCounts [7];
    int maxLevCount = 0;
    for (int i=0;i<7;i++) {
      int levCount = buf[z++];
      levCounts[i] = levCount;
      maxLevCount = levCount > maxLevCount ? levCount : maxLevCount;
      // std::cout << "Level " << i << " count: " << levCounts[i] << std::endl;
    }
    // std::cout << "Max Level count: " << maxLevCount << std::endl;
    std::vector< std::vector<int> > talentList(7);
    std::vector< std::vector<int> > realTalents(7);
    int nTalents = 0;
    for (int l=0;l<7;l++) {
      std::vector<int> talentTiers(levCounts[l]);
      for (int tier=0;tier<levCounts[l];tier++) {
        int tal = buf[z++];
        talentTiers[tier] = tal;
        if (tal) {
          realTalents[l].push_back(tal);
          nTalents += 1;
        }
        // std::cout << "Level " << l << " talent tier " << tier << ": " << talentList[l][tier]  << std::endl;
      }
      talentList[l] = talentTiers;
    }

    int builds[nBuilds][7];
    int infos[nBuilds][2];
    /*
    std::vector< std::vector<int> > builds;
    builds.reserve(7*nBuilds);
    std::vector< std::vector<float> > info;
    infos.reserve(2*nBuilds);
    */
    int fullIndexes[nBuilds];
    int partialIndexes[nBuilds];

    // std::vector<int> buildKeyDic[7][maxLevCount];

    int nPartial = 0;
    int nFull = 0;
    for (int b=0;b<nBuilds;b++) {
      int buildKeys[7];
      int sum = buf[z++];
      int count = buf[z++];
      int wins = buf[z++];
      // std::cout << sum << " (sum), count: " << count << ", wins: " << wins << ", z: " << z << std::endl;

      bool isFullBuild = true;
      for (int t=6;t>=0;t--) {
        int mult = levCounts[t];
        int tal = sum%mult;
        sum = sum/mult;
        if (talentList[t][tal] == 0) {
          isFullBuild=false;
        }
        builds[b][t] = tal;
        //buildKeys[t] = tal;
      }
      /*
      for (int t=0;t<7;t++) {
        std::cout << b << " (build), tier: " << t << ", tal: " << buildKeys[t] << ", talName: " << talentList[t][buildKeys[t]] << std::endl;
      }
      */
      // builds[b] = buildKeys;
      infos[b][0] = wins;
      infos[b][1] = count;

      if (isFullBuild) {
          fullIndexes[nFull++] = b;
      } else {
          partialIndexes[nPartial++] = b;
      }

    }

    int fullBuilds[nFull][11];
    int partialBuilds[nPartial][9];
    for (int b=0;b<nFull;b++) {
      int fKey = fullIndexes[b];
      for (int k=0;k<7;k++) {
        fullBuilds[b][k] = talentList[k][builds[fKey][k]];
      }
      fullBuilds[b][7] = infos[fKey][0];
      fullBuilds[b][8] = infos[fKey][1];
      fullBuilds[b][9] = infos[fKey][0]*1000;
      fullBuilds[b][10] = infos[fKey][1]*1000;;
    }
    for (int b=0;b<nPartial;b++) {
      int fKey = partialIndexes[b];
      for (int k=0;k<7;k++) {
        partialBuilds[b][k] = talentList[k][builds[fKey][k]];
      }
      partialBuilds[b][7] = infos[fKey][0];
      partialBuilds[b][8] = infos[fKey][1];
    }

    return sortTalents(partialBuilds,fullBuilds,nPartial,nFull, realTalents, nTalents);

  }


}