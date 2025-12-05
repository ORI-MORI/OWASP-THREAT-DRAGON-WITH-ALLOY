module n2sf_rules
open n2sf_base

// ============================================================
// [Group A] 구조적 위협 탐지 (Structural Threats)
// ============================================================

// 1. 정보 저장 위반 (Storage Violation)
// 규칙: 시스템 등급보다 높은 등급의 데이터를 저장하면 안 됨
fun FindStorageViolations: System -> Data {
    { s: System, d: Data | 
      d in s.stores 
      and lt[s.grade, d.grade] 
    }
}

// 2. 정보 이동 위반 (Flow Violation)
// 규칙: 데이터 등급보다 낮은 시스템으로 전송 불가
// [예외] 1. 목적지가 CDS(연계장비)인 경우 허용
// [예외] 2. 출발지가 VDI/RBI(논리적 망분리) 사용 중인 경우 허용
fun FindFlowViolations: Connection -> Data {
    { c: Connection, d: Data |
      d in c.carries
      and lt[c.to.grade, d.grade]  // 등급 하락 발생
      and c.to.isCDS = False       // 목적지가 CDS가 아님
      and c.from.isolation = None  // 출발지가 논리적 격리 상태 아님
    }
}

// 3. 위치 부적절성 (Location Mismatch)
// 규칙: 시스템은 자신보다 낮은 등급의 망(Zone)에 배치될 수 없음
fun FindLocationViolations: System {
    { s: System | lt[s.loc.grade, s.grade] }
}

// 4. 우회 접속 (Boundary Bypass) [수정됨]
// 규칙: 인터넷뿐만 아니라 '클라우드', 'PPP' 구역에서 내부망으로 들어오는 것도 통제 대상임
fun FindBypassViolations: Connection {
    { c: Connection |
      // 출발지가 외부 성격(인터넷 + 클라우드 + PPP)인 경우
      (c.from.loc.type in (Internet + Cloud + PPP))
      // 목적지가 내부망인 경우
      and c.to.loc.type = Intranet
      // 연계체계(CDS)가 없으면 위협
      and c.to.isCDS = False
    }
}

// ============================================================
// [Group B] 속성적 위협 탐지 (Attribute Threats)
// ============================================================

// 5. 암호화 미적용 (Unencrypted Channel) [수정됨]
// 규칙: 인터넷, 무선뿐만 아니라 '클라우드', 'PPP' 구간도 암호화 필수
fun FindUnencryptedChannels: Connection {
    { c: Connection |
      // 경로 중 하나라도 위험 구역(인터넷/무선/클라우드/PPP)에 걸치면 검사
      (
        c.from.loc.type in (Internet + Wireless + Cloud + PPP) or 
        c.to.loc.type in (Internet + Wireless + Cloud + PPP)
      )
      // 평문(ClearText)이거나 암호화 속성이 꺼져있으면(False) 위협
      and (c.protocol = ClearText or c.isEncrypted = False)
    }
}

// 6. 인증 및 무결성 미비 (Auth/Integrity Gap)
// 규칙: S등급 이상 시스템은 MFA 필수, 모든 시스템은 자산 등록 필수, 모바일은 MDM 필수
fun FindAuthIntegrityGaps: System {
    { s: System |
      (s.grade in (Sensitive + Classified) and s.authType = Single) or // MFA 미비
      s.isRegistered = False or                                        // 미등록 자산
      (s.type = Mobile and s.hasMDM = False)                           // MDM 없는 모바일
    }
}

// 7. 콘텐츠 통제 부재 (Content Control Failure)
// 규칙: 망 간 이동 시 문서 파일은 CDR 필수, 중요 정보는 DLP 필터링 필수
fun FindContentControlFailures: Connection -> Data {
    { c: Connection, d: Data |
      d in c.carries
      and c.from.loc != c.to.loc  // 망 경계 이동 시
      and (
        (d.fileType = Document and c.hasCDR = False) or // 문서인데 CDR 없음
        (d.grade in (Sensitive + Classified) and c.hasDLP = False) // 중요정보인데 DLP 없음
      )
    }
}

// 8. [NEW] 저장 데이터 암호화 미비 (Unencrypted Storage)
// 규칙: S등급 이상 데이터를 저장하는데 저장소 암호화가 안 된 경우
fun FindUnencryptedStorage: System -> Data {
    { s: System, d: Data |
      d in s.stores
      and d.grade in (Sensitive + Classified)
      and s.isStorageEncrypted = False
    }
}

// 9. [NEW] 관리자 접속 위반 (Admin Access Violation)
// 규칙: 관리 인터페이스 접근은 관리자 전용 단말에서만 가능
fun FindAdminAccessViolation: Connection {
    { c: Connection |
      c.to.isManagement = True     // 목적지가 관리자 포트/장비인데
      and c.from.isManagement = False // 출발지가 일반 단말임
    }
}

// 실행 및 결과 도출
run {}