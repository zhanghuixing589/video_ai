package org.example.video_ai.enums;

/*
* video审核流
* */
public enum VideoStatus {
    DRAFT("Draft", "Saved by studio before submitting"), //草稿
    PENDING("Pending review", "Submitted by studio and waiting for reviewer"), //待审核
    APPROVED("Approved", "Reviewer approved the content"),  //审核通过
    REJECTED("Rejected", "Reviewer rejected the content"), //审核驳回
    PUBLISHED("Published", "Visible to normal users"), //已发布
    BANNED("Banned", "Taken down by administrator"); //被管理员下架

    private final String name;
    private final String description;

    VideoStatus(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
