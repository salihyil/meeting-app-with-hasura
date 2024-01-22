export const GET_MEETING_PARTICIPANTS = `
query getParticipants($id: Int!) {
    meetings_by_pk(id: $id) {
      title
    meeting_date
    user {
      email
      fullName
    }
    participants {
      user {
        email
        fullName
      }
    }
  }
}
`;

export const GET_MEETING_PARTICIPANTS_REMINDER = `
query getParticipantsReminder($meeting_id: Int!) {
  meetings_by_pk(id: $meeting_id) {
    title
    meeting_date
    user {
      email
      fullName
    }
    participants(where: {is_approved: {_eq: true}}) {
      user {
        email
        fullName
      }
    }
  }
}`;