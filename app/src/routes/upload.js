import * as uuid from 'uuid';
import * as crypto from 'crypto';
import fetch from 'node-fetch';

export function sign ({ verb, md5, type, date, resource }) {
    const toSign = `${verb}\n${md5}\n${type}\n${date}\n${resource}`;
    const signature = crypto.createHmac('sha1', process.env.S3_USER_ASSETS_SECRET_KEY)
        .update(toSign)
        .digest('base64');
    return signature;
}

export async function post (req, res, next) {
    const id = uuid.v4();

    const { f } = req.files;
    const bucket = process.env.S3_USER_ASSETS_BUCKET

    const date = (new Date()).toUTCString();
    const s3Res = await fetch(
        `${process.env.S3_USER_ASSETS_ENDPOINT}/${id}`,
        {
            method: 'PUT',
            headers: {
                'content-type': f.mimetype,
                // 'content-md5': f.md5,
                date,
                authorization: `AWS ${process.env.S3_USER_ASSETS_ACCESS_KEY}:${sign({
                    verb: 'PUT',
                    md5: '',
                    type: f.mimetype,
                    date,
                    resource: `/${bucket}/${id}`
                })
                }`
            },
            body: f.data,
        }
    );

    if (s3Res.ok) {
        res.end(JSON.stringify({
            url: `${process.env.S3_USER_ASSETS_ENDPOINT}/${id}`,
        }));
    } else {
        res.writeHead(500);
        console.error(await s3Res.text());
        res.end();
    }
}

// process.env.S3_USER_ASSETS_SECRET = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
// console.log(sign({
//     verb: 'GET',
//     md5: '',
//     type: '',
//     date: 'Tue, 27 Mar 2007 19:36:42 +0000',
//     resource: '/awsexamplebucket1/photos/puppy.jpg'
// })); // should eq 'qgk2+6Sv9/oM7G3qLEjTH1a1l1g='
