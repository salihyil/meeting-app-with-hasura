import axios from "axios";
import express from "express";
import moment from "moment";
import hasura from "../../clients/hasura";
import { transporter } from "../../lib/nodemailer";
import { GET_MEETING_PARTICIPANTS, GET_MEETING_PARTICIPANTS_REMINDER } from "./queries";

const router = express.Router();

router.post("/meeting_created", async (req, res, next) => {
  const meeting = req.body.event.data.new;

  const { meetings_by_pk } = await hasura.request(GET_MEETING_PARTICIPANTS, {
    id: meeting.id,
  });

  const title = meeting.title;
  const { fullName } = meetings_by_pk.user;
  const participants = meetings_by_pk.participants.map(({ user }) => user.email).toString();

  const schedule_event = {
    type: "create_scheduled_event",
    args: {
      webhook: "{{ACTION_BASE_ENDPOINT}}/webhooks/meeting_reminder",
      schedule_at: moment(meetings_by_pk.meeting_date).subtract(2, "minutes"),
      payload: {
        //webhook tetiklendiğinde hangi datalar gönderilmesi gerekiyorsa payloada
        meeting_id: meeting.id,
      },
    },
  };

  //api kullanarak hasuraya eklemek
  const add_event = await axios("http://localhost:8080/v1/query", {
    method: "POST",
    data: JSON.stringify(schedule_event),
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    },
  });

  const event_data = add_event.data;
  /*{
     event_id: '14dd75b8-4d94-4247-96f9-653efc0bd545',
     message: 'success'
    } 
  */

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: participants,
    subject: `${fullName} sizi bir görüşmeye davet etti`,
    text: `${fullName} sizi ${title} adlı bir görüşmeye davet etti`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return next(err);
    } else {
      return res.json({ info });
    }
  });
});

router.post("/meeting_reminder", async (req, res, next) => {
  //toplantıya kaç dk kaldı ise onun bildiri mesajını gönderticez.

  const { meeting_id } = req.body.payload;
  const { meetings_by_pk } = await hasura.request(GET_MEETING_PARTICIPANTS_REMINDER, {
    meeting_id,
  });

  const title = meetings_by_pk.title;
  const { email } = meetings_by_pk.user;
  const participants = meetings_by_pk.participants.map(({ user }) => user.email);
  participants.push(email);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: participants.toString(),
    subject: `${title} başlıklı görüşmeniz birazdan başlıyacak`,
    text: `${title} başlıklı görüşmeniz 2 dakika sonra başlıyacak. Katılmak için aşağıdaki bağlantıyı kullanın. `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return next(err);
    } else {
      return res.json({ info });
    }
  });
});

export default router;
