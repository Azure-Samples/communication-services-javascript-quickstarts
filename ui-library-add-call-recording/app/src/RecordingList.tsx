import { mergeStyles, Stack } from "@fluentui/react";
import { useEffect, useState } from "react";
import { listRecordings } from "./Api";

export interface RecordingListProps {
    serverCallId?: string;
}

export function RecordingList(props: RecordingListProps): JSX.Element {
    const { serverCallId } = props;
    const [blobs, setBlobs] = useState<string[]>([]);

    useEffect(() => {
        const handle = setInterval(async () => {
            if (!serverCallId) {
                return;
            }
            const newRecordings = await listRecordings({ serverCallId });
            if (!listsEqual(newRecordings.blobs, blobs)) {
                // We overwrite the entire list for simplicity.
                setBlobs(newRecordings.blobs);
            }
        }, 500);
        return () => {
            clearInterval(handle);
        }
    }, [serverCallId, blobs, setBlobs]);

    return (<Stack className={mergeStyles({
        background: '#EEEEEE',
        margin: '1rem',
        padding: '1rem',
        borderRadius: '0.625rem'
    })}>
        {blobs.length === 0 && <h3>No recordings yet!</h3>}
        {blobs.length > 0 && (<>
            <h3>Recordings:</h3>
            <ul>
                {blobs.map((blob) => <li>{blob}</li>)}
            </ul>
        </>)
        }
    </Stack>)
}

function listsEqual<T>(first: T[], second: T[]): boolean {
    return first.length === second.length && first.every((item, index) => (item === second[index]));
}