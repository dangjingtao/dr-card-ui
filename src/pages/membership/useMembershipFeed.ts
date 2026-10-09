import { useRemoteData } from '../profile/useProfileFeed'
import { fetchMemberGrades, type MemberGrade } from '../../services/memberGrades'

/** 获取后台启用等级；不在页面按 mock/api 模式分支。 */
export function useMemberGrades() {
  return useRemoteData<MemberGrade[]>(fetchMemberGrades)
}
