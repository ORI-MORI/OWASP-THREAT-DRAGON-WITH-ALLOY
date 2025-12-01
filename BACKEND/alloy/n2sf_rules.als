module n2sf_rules
open n2sf_base

// ============================================================
// [Group A] 구조적 위협 탐지 (Structural Threats)
// ============================================================

// 1. 정보 저장 위반 (Storage Violation)
// 규칙: 시스템 등급보다 높은 등급의 데이터를 저장하면 안 됨
fun FindStorageViolations: System -> Data {
    { s: System, d: Data | 
      d in s.stores and lt[s.grade, d.grade] 
    }
}

// 2. 정보 이동 위반 (Flow Violation)
// 규칙: 데이터 등급보다 낮은 시스템으로 전송 불가 (단, 목적지가 CDS면 예외 허용)
fun FindFlowViolations: Connection -> Data {
    { c: Connection, d: Data |
      d in c.carries
      and lt[c.to.grade, d.grade]  // 목적지 등급이 데이터보다 낮고
      and c.to.isCDS = False       // 목적지가 연계체계(CDS)가 아닌 경우
    }
}

// 3. 위치 부적절성 (Location Mismatch)
// 규칙: 시스템은 자신보다 낮은 등급의 망(Zone)에 배치될 수 없음
fun FindLocationViolations: System {
    { s: System | lt[s.loc.grade, s.grade] }
}

// 4. 우회 접속 (Boundary Bypass)
// 규칙: 인터넷망(Internet)에서 내부망(Intranet)으로 직접 연결 시 CDS를 경유하지 않으면 위협
fun FindBypassViolations: Connection {
    { c: Connection |
      c.from.loc.type = Internet
      and c.to.loc.type = Intranet
      and c.to.isCDS = False       // 목적지가 CDS(보안게이트웨이)가 아님
    }
}

// ============================================================
// [Group B] 속성적 위협 탐지 (Attribute Threats)
// ============================================================

// 5. 암호화 미적용 (Unencrypted Channel)
// 규칙: 인터넷/무선망 구간을 지나는 연결이 평문(ClearText)이거나 암호화 속성이 꺼져있음
fun FindUnencryptedChannels: Connection {
    { c: Connection |
      (c.from.loc.type in (Internet + Wireless) or c.to.loc.type in (Internet + Wireless))
      and (c.protocol = ClearText or c.isEncrypted = False)
    }
}

// 6. 인증 및 무결성 미비 (Auth/Integrity Gap)
// 규칙: 민감(S) 등급 이상 시스템에 '단일 인증'만 쓰거나 '미등록' 상태인 경우
fun FindAuthIntegrityGaps: System {
    { s: System |
      s.grade in (Sensitive + Classified) // S등급 이상인데
      and (s.authType = Single or s.isRegistered = False) // 보안 미비
    }
}

// 7. 콘텐츠 통제 부재 (Content Control Failure)
// 규칙: 망 간 이동(Zone 변경) 시 문서 파일(Document)에 대해 CDR(무해화) 미적용
fun FindContentControlFailures: Connection -> Data {
    { c: Connection, d: Data |
      d in c.carries
      and d.fileType = Document       // 문서 파일인데
      and c.from.loc != c.to.loc      // 망 경계를 넘어가는데
      and c.hasCDR = False            // 무해화 장비가 없음
    }
}

// 실행 명령 (결과 XML 생성을 위해 빈 run 실행)
run {}