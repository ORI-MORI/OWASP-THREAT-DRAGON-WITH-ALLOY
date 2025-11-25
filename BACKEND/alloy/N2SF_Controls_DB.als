module N2SF_Controls_DB
open N2SF_Core

/* [N2SF 보안통제 항목 데이터베이스]
   근거: 국가 망 보안체계 보안 가이드라인 부록 1 (보안통제 항목 해설서)
   구조: 6개 대분류 > 중분류 > 소항목 (Control 객체로 정의)
*/

/* ==========================================================================
   [Chapter 1] 권한 (Authority)
   ========================================================================== */
// 1. 최소 권한 (LP)
one sig N2SF_LP_1, N2SF_LP_2, N2SF_LP_3, N2SF_LP_4 extends Control {}
one sig N2SF_LP_4_1, N2SF_LP_4_2, N2SF_LP_4_3, N2SF_LP_4_4 extends Control {}
one sig N2SF_LP_5 extends Control {}
one sig N2SF_LP_M1, N2SF_LP_M2, N2SF_LP_M3, N2SF_LP_M4 extends Control {}

// 2. 신원 검증 (IV)
one sig N2SF_IV_1, N2SF_IV_2, N2SF_IV_3 extends Control {}
one sig N2SF_IV_2_1 extends Control {}
one sig N2SF_IV_M1 extends Control {}

// 3. 식별자 관리 (IM)
one sig N2SF_IM_1, N2SF_IM_2, N2SF_IM_3, N2SF_IM_4, N2SF_IM_5 extends Control {}

// 4. 계정 관리 (AC)
one sig N2SF_AC_1, N2SF_AC_2, N2SF_AC_3 extends Control {}
one sig N2SF_AC_1_1, N2SF_AC_1_2, N2SF_AC_1_3, N2SF_AC_1_4, N2SF_AC_1_5 extends Control {}
one sig N2SF_AC_3_1, N2SF_AC_3_2, N2SF_AC_3_3 extends Control {}
one sig N2SF_AC_M1, N2SF_AC_M2, N2SF_AC_M3 extends Control {}


/* ==========================================================================
   [Chapter 2] 인증 (Authentication)
   ========================================================================== */
// 1. 다중요소 인증 (MA)
one sig N2SF_MA_1, N2SF_MA_2, N2SF_MA_3, N2SF_MA_4, N2SF_MA_5 extends Control {}
one sig N2SF_MA_M1 extends Control {}

// 2. 외부인증수단 (EI)
one sig N2SF_EI_1, N2SF_EI_2 extends Control {}
one sig N2SF_EI_M1 extends Control {}

// 3. 단말인증 (DA)
one sig N2SF_DA_1, N2SF_DA_2, N2SF_DA_3, N2SF_DA_4, N2SF_DA_5 extends Control {}
one sig N2SF_DA_3_1, N2SF_DA_3_2 extends Control {}

// 4. 인증보호 (AU)
one sig N2SF_AU_1, N2SF_AU_2, N2SF_AU_3, N2SF_AU_4, N2SF_AU_5, N2SF_AU_6 extends Control {}
one sig N2SF_AU_5_1, N2SF_AU_5_2 extends Control {}
one sig N2SF_AU_M1, N2SF_AU_M2 extends Control {}

// 5. 인증정책 (AP)
one sig N2SF_AP_1, N2SF_AP_2, N2SF_AP_3, N2SF_AP_4, N2SF_AP_5 extends Control {}
one sig N2SF_AP_M1, N2SF_AP_M2, N2SF_AP_M3 extends Control {}

// 6. 인증수단 (AM)
one sig N2SF_AM_1, N2SF_AM_2, N2SF_AM_3, N2SF_AM_4, N2SF_AM_5, N2SF_AM_6, N2SF_AM_7, N2SF_AM_8, N2SF_AM_9 extends Control {}
one sig N2SF_AM_M1, N2SF_AM_M2 extends Control {}

// 7. 로그인 (LI)
one sig N2SF_LI_1, N2SF_LI_2, N2SF_LI_3, N2SF_LI_4, N2SF_LI_5, N2SF_LI_6, N2SF_LI_7, N2SF_LI_8, N2SF_LI_9, N2SF_LI_10 extends Control {}
one sig N2SF_LI_M1, N2SF_LI_M2 extends Control {}


/* ==========================================================================
   [Chapter 3] 분리 및 격리 (Segregation & Isolation)
   ========================================================================== */
// 1. 분리 (SG)
one sig N2SF_SG_1, N2SF_SG_2, N2SF_SG_3, N2SF_SG_4, N2SF_SG_5, N2SF_SG_6 extends Control {}
one sig N2SF_SG_2_1, N2SF_SG_3_1, N2SF_SG_5_1 extends Control {}
one sig N2SF_SG_M1, N2SF_SG_M2, N2SF_SG_M3, N2SF_SG_M4, N2SF_SG_M5 extends Control {}

// 2. 격리 (IS)
one sig N2SF_IS_1, N2SF_IS_2, N2SF_IS_3, N2SF_IS_4, N2SF_IS_5, N2SF_IS_6 extends Control {}


/* ==========================================================================
   [Chapter 4] 통제 (Control)
   ========================================================================== */
// 1. 정보흐름 (IF)
one sig N2SF_IF_1, N2SF_IF_2, N2SF_IF_3, N2SF_IF_4, N2SF_IF_5, N2SF_IF_6, N2SF_IF_7, N2SF_IF_8, N2SF_IF_9, N2SF_IF_10 extends Control {}
one sig N2SF_IF_11, N2SF_IF_12, N2SF_IF_13, N2SF_IF_14, N2SF_IF_15 extends Control {}
one sig N2SF_IF_M1, N2SF_IF_M2, N2SF_IF_M3, N2SF_IF_M4, N2SF_IF_M5 extends Control {}

// 2. 외부경계 (EB)
one sig N2SF_EB_1, N2SF_EB_2, N2SF_EB_3, N2SF_EB_4, N2SF_EB_5, N2SF_EB_6, N2SF_EB_7, N2SF_EB_8, N2SF_EB_9, N2SF_EB_10 extends Control {}
one sig N2SF_EB_11, N2SF_EB_12, N2SF_EB_13, N2SF_EB_14, N2SF_EB_15 extends Control {}
one sig N2SF_EB_M1, N2SF_EB_M2, N2SF_EB_M3, N2SF_EB_M4, N2SF_EB_M5 extends Control {}

// 3. CDS (CD)
one sig N2SF_CD_1, N2SF_CD_2, N2SF_CD_3, N2SF_CD_4, N2SF_CD_5, N2SF_CD_6, N2SF_CD_7, N2SF_CD_8, N2SF_CD_9, N2SF_CD_10 extends Control {}
one sig N2SF_CD_11, N2SF_CD_12, N2SF_CD_13 extends Control {}
one sig N2SF_CD_M1, N2SF_CD_M2, N2SF_CD_M3, N2SF_CD_M4 extends Control {}

// 4. 원격접속 (RA)
one sig N2SF_RA_1, N2SF_RA_2, N2SF_RA_3, N2SF_RA_4, N2SF_RA_5, N2SF_RA_6, N2SF_RA_7 extends Control {}
one sig N2SF_RA_M1, N2SF_RA_M2, N2SF_RA_M3 extends Control {}

// 5. 세션 (SN)
one sig N2SF_SN_1, N2SF_SN_2, N2SF_SN_3, N2SF_SN_4, N2SF_SN_5, N2SF_SN_6, N2SF_SN_7, N2SF_SN_8 extends Control {}
one sig N2SF_SN_4_1, N2SF_SN_4_2 extends Control {}
one sig N2SF_SN_M1, N2SF_SN_M2 extends Control {}

// 6. 무선망 접속 (WA)
one sig N2SF_WA_1, N2SF_WA_2, N2SF_WA_3, N2SF_WA_4, N2SF_WA_5, N2SF_WA_6, N2SF_WA_7 extends Control {}
one sig N2SF_WA_M1 extends Control {}

// 7. 블루투스 연결 (BC)
one sig N2SF_BC_1 extends Control {}


/* ==========================================================================
   [Chapter 5] 데이터 (Data)
   ========================================================================== */
// 1. 암호 키 관리 (EK)
one sig N2SF_EK_1, N2SF_EK_2, N2SF_EK_3, N2SF_EK_4, N2SF_EK_5, N2SF_EK_6 extends Control {}
one sig N2SF_EK_M1, N2SF_EK_M2, N2SF_EK_M3 extends Control {}

// 2. 암호 모듈 사용 (EA)
one sig N2SF_EA_1, N2SF_EA_2, N2SF_EA_3 extends Control {}

// 3. 데이터 전송 (DT)
one sig N2SF_DT_1, N2SF_DT_2, N2SF_DT_3, N2SF_DT_4, N2SF_DT_5, N2SF_DT_6 extends Control {}

// 4. 데이터 사용 (DU)
one sig N2SF_DU_1, N2SF_DU_2, N2SF_DU_3, N2SF_DU_4 extends Control {}
one sig N2SF_DU_M1, N2SF_DU_M2, N2SF_DU_M3, N2SF_DU_M4 extends Control {}


/* ==========================================================================
   [Chapter 6] 정보자산 (Information Assets)
   ========================================================================== */
// 1. 모바일 단말 (MD)
one sig N2SF_MD_1, N2SF_MD_2, N2SF_MD_3, N2SF_MD_4, N2SF_MD_5, N2SF_MD_6, N2SF_MD_7, N2SF_MD_8, N2SF_MD_9, N2SF_MD_10, N2SF_MD_11 extends Control {}
one sig N2SF_MD_M1, N2SF_MD_M2 extends Control {}

// 2. 하드웨어 (DV)
one sig N2SF_DV_1, N2SF_DV_2, N2SF_DV_3, N2SF_DV_4, N2SF_DV_5, N2SF_DV_6, N2SF_DV_7, N2SF_DV_8, N2SF_DV_9, N2SF_DV_10, N2SF_DV_11, N2SF_DV_12 extends Control {}
one sig N2SF_DV_M1, N2SF_DV_M2 extends Control {}

// 3. 정보시스템 구성요소 (IN)
one sig N2SF_IN_1, N2SF_IN_2, N2SF_IN_3, N2SF_IN_4, N2SF_IN_5, N2SF_IN_6, N2SF_IN_7, N2SF_IN_8, N2SF_IN_9, N2SF_IN_10 extends Control {}
one sig N2SF_IN_1_1, N2SF_IN_1_2, N2SF_IN_1_3 extends Control {} // 위치 조정
one sig N2SF_IN_11, N2SF_IN_12, N2SF_IN_13, N2SF_IN_14, N2SF_IN_15, N2SF_IN_16 extends Control {}
