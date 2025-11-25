/* ============================================================
   [표준 템플릿 v2.0] N2SF 기관 현황 인스턴스 (Layer 4)
   * 변경사항: Core의 확장된 자산/데이터 속성 반영
   ============================================================ */
module Org_Instance

open N2SF_ModelX_Catalog // [변경] 선택한 모델
open N2SF_Controls_DB    // 고정

/* ============================================================
   1. 자산(Asset) 정의 - [속성 추가됨]
   ============================================================ */
/* ============================================================
   1. 자산(Asset) 정의 - [속성 추가됨]
   ============================================================ */
one sig MyPC__Level__S___Zone__Int_ extends Asset {}
one sig ExtServer__Level__O___Zone__Ext_ extends Asset {}


/* ============================================================
   2. 데이터(Data) 정의 - [속성 추가됨]
   ============================================================ */
one sig Data_0 extends Data {}


/* ============================================================
   3. 흐름(Flow) 정의
   ============================================================ */
one sig Flow_0 extends Flow {}

fact Instance_Properties {
    MyPC__Level__S___Zone__Int_.level = Open
    MyPC__Level__S___Zone__Int_.zone = Internal
    MyPC__Level__S___Zone__Int_.status = Secure
    MyPC__Level__S___Zone__Int_.is_registered = True
    MyPC__Level__S___Zone__Int_.has_agent = True
    ExtServer__Level__O___Zone__Ext_.level = Open
    ExtServer__Level__O___Zone__Ext_.zone = Internal
    ExtServer__Level__O___Zone__Ext_.status = Secure
    ExtServer__Level__O___Zone__Ext_.is_registered = True
    ExtServer__Level__O___Zone__Ext_.has_agent = True
    Data_0.classification = Open
    Data_0.content = Clean
    Data_0.is_sanitized = True
    Flow_0.from = MyPC__Level__S___Zone__Int_
    Flow_0.to = ExtServer__Level__O___Zone__Ext_
    Flow_0.data = Data_0
    Flow_0.via = none
    Flow_0.is_encrypted = False
}



/* ============================================================
   4. 구현 현황 (Implementation)
   ============================================================ */
fact Define_Org_Security {
    Org_Implementation.implemented = 
        // [템플릿] N2SF_XX_1 + N2SF_XX_2
        none
        
    Org_Implementation.exceptions = none
}

/* ============================================================
   5. 검증 (Verification)
   ============================================================ */
assert Policy_Compliance {
    Check_Security_Pass
}
check Policy_Compliance for 3
